import type { Metadata } from "next";
import Link from "next/link";
import { ExamPrepInterestForm } from "@/components/mewstro/ExamPrepInterestForm";

export const metadata: Metadata = {
  title: "Practice for your grade exam · Mewstro",
  description:
    "Mewstro keeps your pieces, scales, sight-reading and aural in one practice plan, with recordings so you can hear the progress. For ABRSM, Trinity and other graded exams. A structured grade-by-grade pathway is coming; tell us which grade to build first.",
};

const TEAL = "#2D8B7E";

const today = [
  {
    title: "Your pieces, with a date on them",
    body: "Add the three pieces to your repertoire with the exam as the target date. Log which one you worked on each session and watch the balance between them, so the piece you avoid stops hiding.",
  },
  {
    title: "Scales, sight-reading and aural in the plan",
    body: "The weekly planner takes any task type, not just pieces. Put five minutes of scales and five of sight-reading on the days you practise and the mascot keeps you honest about whether they happened.",
  },
  {
    title: "Hear the progress",
    body: "Milestone Moments record a passage when it clicks. Play the recording from three weeks ago next to today's and the improvement is audible, which matters more than a minutes total ever will.",
  },
  {
    title: "Your teacher in the loop",
    body: "If your teacher is on Mewstro, the pieces and tasks they set land in the app, and they see what you practised before the next lesson instead of asking.",
  },
];

const coming = [
  "A checklist of what the grade actually requires, by board and syllabus edition, so nothing is discovered the week before",
  "A suggested week built from your available time: pieces, technique, sight-reading and aural in sensible proportion, editable",
  "A confidence note per item, so you and your teacher can see which scales still wobble rather than guessing",
];

export default function ExamPrepPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#1A1A2E]">
      <section className="px-6 pb-12 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: TEAL }}
          >
            Preparing for a grade exam
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Three pieces, the scales, the sight-reading, the aural.
            <br />
            <span style={{ color: TEAL }}>One practice plan.</span>
          </h1>
          <p className="mt-6 text-lg text-[#5A4E42]">
            Exam practice is a balancing act, and the thing you are worst at
            is the thing you practise least. Mewstro puts the whole syllabus
            in one place, keeps track of what actually got practised, and
            lets you hear yourself improving.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/mewstro/app"
              className="inline-block rounded-full px-7 py-3.5 text-base font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: TEAL }}
            >
              Get Mewstro, free to start
            </Link>
            <a
              href="#pathway"
              className="inline-block rounded-full border border-[#E8DFD3] bg-white px-7 py-3.5 text-base font-semibold text-[#1A1A2E] hover:bg-[#FAF6EF]"
            >
              What&apos;s coming for exam prep
            </a>
          </div>
          <p className="mt-4 text-xs text-[#6B7280]">
            Mewstro is independent and not affiliated with ABRSM, Trinity or
            any exam board.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs uppercase tracking-wider text-[#6B7280]">
            What you can do today
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {today.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-7"
              >
                <h2 className="text-xl font-bold">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#5A4E42]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#6B7280]">
            Free covers the timer, one instrument and seven days of history.
            Premium is £4.99 a month or £39.99 a year, with a 7-day trial.{" "}
            <Link
              href="/mewstro/pricing"
              className="font-semibold hover:underline"
              style={{ color: TEAL }}
            >
              Full pricing
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="pathway" className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
          <div>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: TEAL }}
            >
              Coming next, if enough of you want it
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              A grade-by-grade pathway, starting with ABRSM piano.
            </h2>
            <p className="mt-4 text-base text-[#5A4E42]">
              I am building a structured route through a grade: what the
              syllabus requires, a week that fits your time, and a way to see
              which parts are ready and which are not. I would rather build
              the grade people are actually sitting than guess, so this form
              decides what comes first.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#5A4E42]">
              {coming.map((c) => (
                <li key={c} className="flex gap-3">
                  <span style={{ color: TEAL }}>✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-[#6B7280]">
              Nothing here is exam advice. Mewstro helps you practise what
              your teacher and the syllabus set; it does not judge whether you
              are ready.
            </p>
          </div>
          <ExamPrepInterestForm />
        </div>
      </section>

      <section className="border-t border-[#E8DFD3] bg-white px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold md:text-4xl">
            Teach students through their grades?
          </h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            One subscription covers every student you invite. Set the pieces
            and tasks, see who practised what, and stop asking on the
            doorstep.
          </p>
          <Link
            href="/mewstro"
            className="mt-8 inline-block rounded-full px-8 py-4 text-base font-semibold text-white transition-colors"
            style={{ backgroundColor: TEAL }}
          >
            Mewstro for teachers
          </Link>
        </div>
      </section>
    </div>
  );
}
