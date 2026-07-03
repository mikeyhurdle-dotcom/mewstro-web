"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getEntitledStudios,
  verifyPasswordAndLogin,
} from "@/lib/teacher-auth";
import { createTeacherAuthClient } from "@/lib/teacher/supabase/server";

/**
 * Login actions for /teacher/login. Each lives in this file with a
 * file-level `"use server"` directive — the Next.js canonical pattern for
 * server actions invoked via `<form action={...}>`. Module-level inline
 * actions with the directive inside the function body do not wire up
 * reliably in Next 16.
 */

/** Legacy studio-password fallback (unchanged behaviour). */
export async function loginAction(formData: FormData): Promise<void> {
  const password = (formData.get("password") as string | null)?.trim() ?? "";
  const ok = await verifyPasswordAndLogin(password);
  if (ok) {
    redirect("/teacher");
  }
  redirect("/teacher/login?error=1");
}

/**
 * Builds the absolute callback URL from the request's own host so the
 * magic link lands on the origin the teacher is actually using
 * (studio.mewstro.com vs mewstro.com vs localhost) and the auth cookies
 * end up on the right host. Supabase's redirect-URL allowlist is the
 * backstop against a spoofed Host header — unknown origins fall back to
 * the configured Site URL.
 */
async function callbackUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    return `${site}/teacher/auth/callback`;
  }
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : "https");
  return `${proto}://${host}/teacher/auth/callback`;
}

/**
 * "Email me a sign-in link" — the primary auth path.
 *
 * Entitlement is checked BEFORE sending: only an email that owns an
 * active mewstro_studios row (teacher_email, case-insensitive) gets a
 * link. For entitled emails we allow Supabase to create the auth user on
 * first sign-in (`shouldCreateUser: true`) — self-serve teachers are
 * provisioned by the Stripe webhook as a studio row, not as an auth
 * user, so their first magic link is what mints the account. The studio
 * row is the gate, exactly as the design doc intends.
 *
 * The redirect is the same whether or not the email matched, so this
 * form can't be used to probe which addresses have studios.
 */
export async function sendMagicLinkAction(formData: FormData): Promise<void> {
  const email = (formData.get("email") as string | null)
    ?.trim()
    .toLowerCase();
  if (!email || !/.+@.+\..+/.test(email)) {
    redirect("/teacher/login?error=email");
  }

  let entitled = false;
  try {
    entitled = (await getEntitledStudios(email!)).length > 0;
  } catch (err) {
    console.error("teacher/login: entitlement check failed", err);
  }

  if (entitled) {
    try {
      const supabase = await createTeacherAuthClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email!,
        options: {
          emailRedirectTo: await callbackUrl(),
          shouldCreateUser: true,
        },
      });
      if (error) {
        console.error("teacher/login: signInWithOtp failed", error);
        redirect("/teacher/login?error=send");
      }
    } catch (err) {
      // redirect() throws internally — let those through.
      if (err && typeof err === "object" && "digest" in err) throw err;
      console.error("teacher/login: magic link send failed", err);
      redirect("/teacher/login?error=send");
    }
  }

  redirect(`/teacher/login?sent=1&email=${encodeURIComponent(email!)}`);
}
