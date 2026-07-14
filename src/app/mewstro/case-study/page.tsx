import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The invisible week between lessons became visible — a Mewstro case study",
  description:
    "In under four weeks as a Founding Studio, Josh Ingram's studio had enough activity that the week between lessons started to become visible: six students, 27 logged sessions, 855 minutes of practice.",
  openGraph: {
    title:
      "The invisible week between lessons became visible in under four weeks",
    description:
      "A real Founding Studio case study: six students, 27 logged sessions, 855 minutes of practice — and a teacher who can finally see the week between lessons.",
  },
};

const stats = [
  { value: "6", label: "students joined" },
  { value: "27", label: "logged sessions" },
  { value: "855", label: "minutes of practice" },
  { value: "<4 weeks", label: "as a founding studio" },
];

const students = [
  "One student logged 12 practice days and 441 minutes.",
  "Another joined later and still reached three sessions and 170 minutes in their first week.",
  "A lighter piano student logged four smaller sessions across four recent days.",
  "One student joined but had not yet practised, which is useful too — the teacher can see the silence as well as the momentum.",
];

export default function MewstroCaseStudyPage() {
  return (
    <div className="text-[#1A1A2E]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FFFBF7] px-6 py-20 md:py-28">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#F4845F] opacity-20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2D8B7E]">
            Founding studio · Case study
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
            The invisible week between lessons became visible in under four
            weeks
          </h1>
          <p className="mt-6 text-lg text-[#5A4E42]">
            Josh Ingram joined Mewstro as one of the first Founding Studios in
            June 2026.
          </p>
        </div>
      </section>

      {/* Narrative */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-5 text-lg leading-relaxed text-[#5A4E42]">
          <p>
            The aim was simple: help Josh see what happened between lessons
            without turning his studio into an admin project. Mewstro started
            from my own attempt to learn the real art of practising. I had
            returned to piano just before turning 40 and began using printouts
            to focus what I wanted to achieve in each session, while recording
            in a spreadsheet how I was actually spending my time. My teacher
            Ellie saw the system, thought other students might benefit, and
            helped turn it into a teacher-shaped product.
          </p>
          <p className="text-xl font-semibold text-[#1A1A2E]">
            Josh&apos;s first month is the same story from the teacher side.
          </p>
          <p>
            In less than four weeks as a founding studio, six students joined
            Josh&apos;s Mewstro studio. Five logged practice, and five reached
            at least three practice sessions. Across the studio, Josh could see
            27 logged sessions and 855 minutes of practice.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#FFFBF7] px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#E8DFD3] bg-white p-6 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-[#2D8B7E] md:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-[#6B7280]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The shape of the week */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xl font-semibold leading-relaxed text-[#1A1A2E]">
            The important part is not the total number. It is the shape of the
            week becoming visible.
          </p>
          <ul className="mt-8 space-y-4">
            {students.map((line) => (
              <li
                key={line}
                className="flex gap-3 rounded-2xl border border-[#E8DFD3] bg-[#FAF6EF] p-5 text-base leading-relaxed text-[#5A4E42]"
              >
                <span aria-hidden className="text-[#2D8B7E]">
                  ▸
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lesson continuity */}
      <section className="bg-[#FFFBF7] px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-5 text-lg leading-relaxed text-[#5A4E42]">
          <p>
            Josh also used Mewstro for specific lesson continuity, not generic
            homework reminders. Early assignments included barre chord
            transitions, book exercises, vocal placement and compression, and
            one more practice session before the next class.
          </p>
          <p className="text-xl font-semibold text-[#1A1A2E]">
            That is the core value of Mewstro in a founding studio: it does not
            replace the teacher. It gives the teacher the week back.
          </p>
        </div>
      </section>

      {/* Josh's own words */}
      <section className="bg-white px-6 py-16">
        <figure className="mx-auto max-w-3xl rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
          <p className="text-xs uppercase tracking-wider text-[#6B7280]">
            In Josh&apos;s words
          </p>
          <blockquote className="mt-4 text-xl leading-relaxed text-[#1A1A2E]">
            &ldquo;Overall Mewstro has given me a clearer understanding of my
            students&apos; activity in between lessons. It has allowed me
            greater ease of sharing learning materials with my students and has
            enabled me to have a source of contact which was missing before
            using the app.&rdquo;
          </blockquote>
          <figcaption className="mt-5">
            <span className="text-sm font-semibold text-[#1A1A2E]">
              Josh Ingram
            </span>
            <span className="ml-2 text-xs text-[#6B7280]">
              Founding Studio #2
            </span>
          </figcaption>
        </figure>
      </section>

      {/* CTA */}
      <section className="bg-[#FFFBF7] px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            Want the week back in your own studio?
          </h2>
          <p className="mt-4 text-lg text-[#5A4E42]">
            The founding round is open. Five studios, 50% off for life, a direct
            line to me, and first say on where the product goes next.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/mewstro/teachers/apply"
              className="inline-block rounded-full bg-[#2D8B7E] px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Apply for a Founding Studio slot
            </Link>
            <Link
              href="/mewstro/story"
              className="inline-block text-sm font-semibold text-[#2D8B7E] hover:underline"
            >
              Read the story behind Mewstro →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
