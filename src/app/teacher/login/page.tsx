import { isTeacherLoggedIn } from "@/lib/teacher-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { loginAction, sendMagicLinkAction } from "./actions";

export const metadata = {
  title: "Sign in · Mewstro Teacher",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  "1": "That password didn't match. Try again or message me.",
  email: "That doesn't look like an email address — check it and try again.",
  send: "Couldn't send the link just now. Give it a minute and try again.",
  auth: "That sign-in link didn't work — it may have expired. Enter your email for a fresh one.",
  nostudio:
    "That email isn't linked to a studio yet. If you've just signed up, use the email you checked out with — or reply to your welcome email and I'll sort it.",
};

export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>;
}) {
  // If already logged in (either mode), bounce straight to the dashboard
  if (await isTeacherLoggedIn()) {
    redirect("/teacher");
  }

  const params = await searchParams;
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES["1"])
    : null;
  const sentTo = params.sent === "1" ? (params.email ?? null) : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Teacher dashboard</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Enter your email and I&apos;ll send you a one-time sign-in link.
            No password to remember.
          </p>
        </div>

        {sentTo ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#F0F7F5] px-4 py-3 text-sm text-[#1A1A2E]">
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-[#4B5563]">
                If <span className="font-medium">{sentTo}</span> is linked to
                a Mewstro studio, a sign-in link is on its way. Links only go
                to the email address on the studio — usually the one you
                signed up with.
              </p>
            </div>
            <p className="text-center text-xs text-[#6B7280]">
              Nothing after a couple of minutes? Check spam, or{" "}
              <Link
                href="/teacher/login"
                className="underline hover:text-[#2D8B7E]"
              >
                try again
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <form action={sendMagicLinkAction} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#1A1A2E]"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-1 block w-full rounded-lg border border-[#E8DFD3] bg-[#FFFBF7] px-3 py-2 text-base focus:border-[#2D8B7E] focus:outline-none focus:ring-2 focus:ring-[#2D8B7E]/20"
                />
              </div>

              {errorMessage && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#2D8B7E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#246F64] transition-colors"
              >
                Email me a sign-in link
              </button>
            </form>

            <details className="mt-6 border-t border-[#E8DFD3] pt-4">
              <summary className="cursor-pointer text-center text-xs text-[#6B7280] hover:text-[#2D8B7E]">
                Have a studio password instead?
              </summary>
              <form action={loginAction} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#1A1A2E]"
                  >
                    Studio password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="mt-1 block w-full rounded-lg border border-[#E8DFD3] bg-[#FFFBF7] px-3 py-2 text-base focus:border-[#2D8B7E] focus:outline-none focus:ring-2 focus:ring-[#2D8B7E]/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-[#2D8B7E] px-4 py-2 text-sm font-semibold text-[#2D8B7E] hover:bg-[#F0F7F5] transition-colors"
                >
                  Sign in with password
                </button>
                <p className="text-center text-xs text-[#6B7280]">
                  Passwords are being retired — email links are the new way
                  in.
                </p>
              </form>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
