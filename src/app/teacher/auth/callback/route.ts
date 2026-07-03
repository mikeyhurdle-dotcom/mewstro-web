import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createTeacherAuthClient } from "@/lib/teacher/supabase/server";
import {
  getEntitledStudios,
  setActiveStudioSelector,
} from "@/lib/teacher-auth";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Lands the teacher magic-link. Mirrors the student /practice/auth/callback:
 * handles both the token_hash format (Supabase email template pointed
 * straight at us — works across devices/browsers) and the PKCE `?code=`
 * format (same-browser flow), then applies the entitlement gate:
 *
 *   verified email must own ≥1 active mewstro_studios row (teacher_email,
 *   case-insensitive) or the session is discarded on the spot.
 *
 * On success: the active-studio selector cookie is set to the teacher's
 * first studio (unless a still-valid selection exists), a login event is
 * recorded for the Watcher (best-effort), and we land on /teacher.
 */

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const supabase = await createTeacherAuthClient();

  let authed = false;

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authed = !error;
  }

  if (!authed) {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      authed = !error;
    }
  }

  if (!authed) {
    return NextResponse.redirect(`${origin}/teacher/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;

  const studios = email ? await getEntitledStudios(email) : [];
  if (!email || studios.length === 0) {
    // Authenticated, but this email isn't linked to any studio. Drop the
    // session so it can't linger, and explain on the login page.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/teacher/login?error=nostudio`);
  }

  // Keep an existing valid selection (multi-studio teachers switching
  // devices), otherwise default to the first studio.
  const currentSelection = request.cookies.get("mewstro_teacher_studio")?.value;
  const keepSelection =
    currentSelection && studios.some((s) => s.id === currentSelection);
  if (!keepSelection) {
    await setActiveStudioSelector(studios[0].id);
  }

  recordLoginEvent(email, (keepSelection ? currentSelection : studios[0].id)!);

  return NextResponse.redirect(`${origin}/teacher`);
}

/**
 * Per-teacher login telemetry (design doc §4) — the leading indicator of
 * a pilot that's sticking. Best-effort: the table ships via a manual
 * migration (docs/db-migrations), so failures only warn.
 */
function recordLoginEvent(teacherEmail: string, studioId: string): void {
  try {
    const supabase = getServerSupabase();
    void supabase
      .from("mewstro_teacher_login_events")
      .insert({
        teacher_email: teacherEmail.toLowerCase(),
        studio_id: studioId,
        event: "magic_link_login",
      })
      .then(({ error }) => {
        if (error) {
          console.warn("teacher/auth/callback: login event insert failed", error);
        }
      });
  } catch (err) {
    console.warn("teacher/auth/callback: login event skipped", err);
  }
}
