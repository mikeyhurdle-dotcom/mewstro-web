import { isTeacherLoggedIn } from "@/lib/teacher-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teacher Dashboard · Mewstro",
  description: "Your studio's practice activity at a glance.",
  robots: { index: false, follow: false },
};

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Route-level auth gate. The /teacher/login page sets its own rendering
  // so children below it can short-circuit the check.
  const loggedIn = await isTeacherLoggedIn();

  // The login page handles its own rendering; if someone navigates to
  // /teacher/login directly while not authed we still want to show it.
  // This gate only blocks the dashboard routes.

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#1A1A2E]">
      <header className="border-b border-[#E8DFD3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/teacher"
            className="flex items-center gap-2 text-lg font-bold"
          >
            <Image
              src="/mewstro/app-icon.png"
              alt="Mewstro"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span>Mewstro</span>
            <span className="text-[#6B7280] font-normal">· Teacher</span>
          </Link>
          {loggedIn && (
            <div className="flex items-center gap-5">
              <Link
                href="/teacher/billing"
                className="text-sm text-[#6B7280] hover:text-[#2D8B7E] transition-colors"
              >
                Billing
              </Link>
              <Link
                href="/teacher/help"
                className="text-sm text-[#6B7280] hover:text-[#2D8B7E] transition-colors"
              >
                Help
              </Link>
              <form action="/api/teacher-logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-[#6B7280] hover:text-[#2D8B7E] transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-[#E8DFD3] bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-[#6B7280]">
          <p>
            Built by Mikey Hurdle. Feedback: reply to any Mewstro email, or
            message me directly.
          </p>
          <p className="mt-2 text-xs">
            Mewstro Teacher · Supabase-backed
          </p>
        </div>
      </footer>
    </div>
  );
}
