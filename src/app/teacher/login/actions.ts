"use server";

import { verifyPasswordAndLogin } from "@/lib/teacher-auth";
import { redirect } from "next/navigation";

/**
 * Password-gate login action. Called from the form on /teacher/login.
 * Lives in its own file with a file-level `"use server"` directive —
 * this is the Next.js canonical pattern for server actions invoked via
 * `<form action={...}>`. Module-level inline actions with the directive
 * inside the function body do not wire up reliably in Next 16.
 */
export async function loginAction(formData: FormData): Promise<void> {
  console.log("[loginAction] entered", {
    envKeys: Object.keys(process.env).filter((k) =>
      k.startsWith("TEACHER_DASHBOARD"),
    ),
    nodeEnv: process.env.NODE_ENV,
  });
  const password = (formData.get("password") as string | null)?.trim() ?? "";
  console.log("[loginAction] password length", password.length);
  let ok = false;
  try {
    ok = await verifyPasswordAndLogin(password);
    console.log("[loginAction] verifyPasswordAndLogin returned", { ok });
  } catch (err) {
    console.error("[loginAction] verifyPasswordAndLogin threw", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
  if (ok) {
    console.log("[loginAction] redirecting to /teacher");
    redirect("/teacher");
  }
  console.log("[loginAction] redirecting to login error");
  redirect("/teacher/login?error=1");
}
