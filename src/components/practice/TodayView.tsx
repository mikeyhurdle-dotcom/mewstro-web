"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Assignment } from "@/lib/practice/assignments";
import {
  type SessionLike,
  currentStreak,
  weeklyMinutes,
} from "@/lib/practice/streak";
import { formatMinutes } from "@/lib/practice/duration";

/**
 * Portal home. Streak + weekly minutes are computed in the browser so
 * the user's own timezone draws the day boundaries — exactly like the
 * iOS app computing on-device.
 */
export function TodayView({
  displayName,
  hasStudio,
  sessions,
  assignments,
}: {
  displayName: string | null;
  hasStudio: boolean;
  sessions: SessionLike[];
  assignments: Assignment[];
}) {
  // Computed after mount: the server renders in UTC, and a UTC-rendered
  // streak could differ from the user's local one around midnight.
  const [stats, setStats] = useState<{ streak: number; weekly: number } | null>(
    null,
  );

  useEffect(() => {
    setStats({
      streak: currentStreak(sessions),
      weekly: weeklyMinutes(sessions),
    });
  }, [sessions]);

  const firstName = displayName?.split(" ")[0];
  const streak = stats?.streak ?? 0;
  const hasHistory = sessions.length > 0;

  return (
    <main className="flex flex-col px-6 pt-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Hi ${firstName}` : "Hello there"}
          </h1>
          <p className="mt-1 text-sm text-mewstro-dim">
            {streak > 0
              ? "Keep the music going."
              : "Every practice deserves an encore."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/mewstro/mascot.png"
            alt="Mewstro the cat"
            width={72}
            height={72}
            priority
          />
          <Link
            href="/practice/settings"
            aria-label="Settings"
            className="rounded-full p-2 text-mewstro-dim"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#E8DFD3] bg-mewstro-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-mewstro-dim">
            Streak
          </p>
          <p className="mt-1 text-3xl font-bold" aria-live="polite">
            {stats === null ? "–" : streak > 0 ? `${streak} 🔥` : "0"}
          </p>
          <p className="mt-1 text-xs text-mewstro-dim">
            {stats === null
              ? " "
              : streak > 0
                ? streak === 1
                  ? "day strong — encore tomorrow?"
                  : "days and counting"
                : hasHistory
                  ? "today's a fresh page"
                  : "starts with one session"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8DFD3] bg-mewstro-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-mewstro-dim">
            This week
          </p>
          <p className="mt-1 text-3xl font-bold">
            {stats === null ? "–" : formatMinutes(stats.weekly)}
          </p>
          <p className="mt-1 text-xs text-mewstro-dim">of practice logged</p>
        </div>
      </div>

      <Link
        href="/practice/timer"
        className="mt-6 rounded-2xl bg-mewstro-primary px-6 py-4 text-center text-base font-semibold text-white shadow-sm"
      >
        Start practising
      </Link>

      {assignments.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold">From your teacher</h2>
            <Link
              href="/practice/assignments"
              className="text-sm font-semibold text-mewstro-primary"
            >
              See all
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {assignments.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-[#E8DFD3] bg-mewstro-surface p-4"
              >
                <p className="text-sm font-semibold">{a.title}</p>
                {a.due_date && (
                  <p className="mt-1 text-xs text-mewstro-dim">
                    Due{" "}
                    {new Date(`${a.due_date}T12:00:00`).toLocaleDateString(
                      undefined,
                      { weekday: "short", day: "numeric", month: "short" },
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasStudio && (
        <section className="mt-8 rounded-2xl bg-mewstro-primary/10 p-5">
          <h2 className="text-base font-bold">Learning with a teacher?</h2>
          <p className="mt-1 text-sm text-mewstro-dim">
            Join their studio with an invite code and your practice shows up
            on the studio leaderboard.
          </p>
          <Link
            href="/practice/join"
            className="mt-4 inline-block rounded-full bg-mewstro-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Join your studio
          </Link>
        </section>
      )}
    </main>
  );
}
