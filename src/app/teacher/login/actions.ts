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
  const ok = await verifyPasswordAndLogin(password);
  if (ok) {
    redirect("/teacher");
  }
  redirect("/teacher/login?error=1");
}
