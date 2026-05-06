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
  const password = (formData.get("password") as string | null)?.trim() ?? "";
  let ok = false;
  try {
    ok = await verifyPasswordAndLogin(password);
  } catch (err) {
    console.error("[loginAction] verifyPasswordAndLogin threw", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      envKeys: Object.keys(process.env).filter((k) =>
        k.startsWith("TEACHER_DASHBOARD"),
      ),
    });
    throw err;
  }
  if (ok) {
    redirect("/teacher");
  }
  redirect("/teacher/login?error=1");
}
