"use client";

import { FormEvent, useState } from "react";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const fieldClass =
  "mt-1 w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none focus:ring-2 focus:ring-[#2D8B7E]/20";

/**
 * Interest form for the structured exam-prep pathway. Deliberately short:
 * email plus the four facts that decide which grade template to build first.
 */
export function ExamPrepInterestForm() {
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmit({ status: "submitting" });
    try {
      const res = await fetch("/api/exam-prep-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          role: data.get("role"),
          instrument: data.get("instrument"),
          board: data.get("board"),
          grade: data.get("grade"),
          timeframe: data.get("timeframe"),
          hasTeacher: data.get("hasTeacher"),
          note: data.get("note"),
          website: data.get("website"),
          sourcePath: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Something went wrong.");
      }
      setSubmit({ status: "success" });
    } catch (err) {
      setSubmit({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  if (submit.status === "success") {
    return (
      <div className="rounded-3xl border border-[#2D8B7E]/30 bg-white p-8 text-center shadow-sm">
        <h3 className="text-2xl font-bold text-[#1A1A2E]">Thank you.</h3>
        <p className="mt-3 text-sm text-[#5A4E42]">
          That tells me which grade to build first. I&apos;ll email you when
          the pathway is ready to try, and not about anything else.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[#E8DFD3] bg-white p-6 shadow-sm md:p-8"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-[#1A1A2E] md:col-span-2">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E]">
          I am
          <select name="role" className={fieldClass} defaultValue="learner">
            <option value="learner">Learning an instrument</option>
            <option value="teacher">A teacher</option>
            <option value="parent">A parent</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E]">
          Instrument
          <input
            name="instrument"
            type="text"
            className={fieldClass}
            placeholder="Piano, violin, voice..."
            maxLength={60}
          />
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E]">
          Exam board
          <select name="board" className={fieldClass} defaultValue="abrsm">
            <option value="abrsm">ABRSM</option>
            <option value="trinity">Trinity</option>
            <option value="rsl">RSL (Rockschool)</option>
            <option value="lcm">LCM</option>
            <option value="other">Another board</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E]">
          Grade you&apos;re working towards
          <select name="grade" className={fieldClass} defaultValue="">
            <option value="">Not sure yet</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E]">
          When is the exam?
          <select name="timeframe" className={fieldClass} defaultValue="unsure">
            <option value="this_term">This term</option>
            <option value="next_six_months">In the next six months</option>
            <option value="next_year">Next year</option>
            <option value="unsure">No date yet</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E]">
          Do you have a teacher?
          <select name="hasTeacher" className={fieldClass} defaultValue="">
            <option value="">Prefer not to say</option>
            <option value="yes">Yes</option>
            <option value="no">No, learning on my own</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1A1A2E] md:col-span-2">
          Anything else? (optional)
          <textarea
            name="note"
            rows={3}
            maxLength={1000}
            className={fieldClass}
            placeholder="What would make exam practice easier for you?"
          />
        </label>
        {/* Honeypot: hidden from people, filled by bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
      </div>

      {submit.status === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {submit.message}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#6B7280]">
          One email when it&apos;s ready. No mailing list.
        </p>
        <button
          type="submit"
          disabled={submit.status === "submitting"}
          className="rounded-full bg-[#2D8B7E] px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
        >
          {submit.status === "submitting" ? "Sending..." : "Tell me when it's ready"}
        </button>
      </div>
    </form>
  );
}
