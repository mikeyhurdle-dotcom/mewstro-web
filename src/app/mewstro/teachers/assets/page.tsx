import type { Metadata } from "next";
import Link from "next/link";
import { AssetGenerator } from "@/components/mewstro/teacher-assets/AssetGenerator";

export const metadata: Metadata = {
  title: "Studio toolkit — Mewstro for teachers",
  description:
    "Branded handouts for your studio, generated in your browser. Student welcome guides, parent notes, printable practice trackers, all customised with your studio name and invite code. Free for every teacher on Mewstro.",
};

export default function TeacherAssetsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#2D8B7E]">
          Studio toolkit
        </p>
        <h1 className="mt-2 text-4xl font-bold text-[#1A1A2E] md:text-5xl">
          Branded handouts for your studio, ready in about a minute.
        </h1>
        <p className="mt-5 text-base text-[#5A4E42] md:text-lg">
          You shouldn&apos;t have to build the rollout pack yourself. When
          you sign your studio up to Mewstro, the welcome guide, parent note,
          and practice tracker are right here, customised with your studio
          name, your invite code, and your accent colour. Print, email, or
          stick on the fridge.
        </p>
        <p className="mt-4 text-sm text-[#6B7280]">
          Free for every teacher on Mewstro. No watermark, no Mewstro
          branding fighting yours, no upsell.
        </p>
      </div>

      <section className="mb-14 grid gap-4 md:grid-cols-3">
        <ValueCard
          icon="✦"
          title="Built in your browser"
          body="Nothing is uploaded or stored. The PDF is rendered locally and downloaded straight to your machine."
        />
        <ValueCard
          icon="⚐"
          title="Your studio, your colour"
          body="Studio name on the cover, your accent colour on every header, your invite code in big bold print."
        />
        <ValueCard
          icon="✎"
          title="In your voice, mostly"
          body="The student handout reads as a note from you. Tweak the wording yourself if you want, the source is yours."
        />
      </section>

      <div className="mb-12 rounded-2xl border border-dashed border-[#2D8B7E]/40 bg-[#2D8B7E]/5 p-5 text-sm text-[#5A4E42] md:flex md:items-center md:justify-between md:gap-6">
        <p className="md:max-w-2xl">
          <strong className="text-[#1A1A2E]">Just browsing?</strong> Have a
          play with the form below to see what you&apos;d be sending out.
          You can download a sample with placeholder details, no commitment.
          When you&apos;re ready, the 30-day free trial starts from the{" "}
          <Link
            href="/mewstro/pricing"
            className="font-semibold text-[#2D8B7E] hover:underline"
          >
            pricing page
          </Link>
          .
        </p>
      </div>

      <AssetGenerator />

      <section className="mt-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-[#1A1A2E]">
            What&apos;s in the toolkit
          </h2>
          <p className="mt-3 text-base text-[#5A4E42]">
            Three documents, each doing a specific job in your studio
            rollout.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <InfoCard
            eyebrow="1. Student Welcome"
            title="The handout you give every student"
            body="Two pages, written from you to them. Explains what Mewstro is, how to install it, where to put the invite code, and the questions students always ask. Branded with your studio."
          />
          <InfoCard
            eyebrow="2. Parent Note"
            title="For parents of younger students"
            body="A note from me (Mikey, the founder) explaining who built this and why, what the app stores, and how to help their child set it up. Shifts the trust load off you."
          />
          <InfoCard
            eyebrow="3. Fridge Tracker"
            title="A printable weekly habit sheet"
            body="One page, sticks on the practice room wall. Tick a box per day, fill in what you played, colour in a star for every Mewstro session. Bring it to the next lesson."
          />
        </div>
      </section>

      <section className="mt-20 rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm md:p-12">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] md:text-3xl">
              You teach. I&apos;ll handle the rest.
            </h2>
            <p className="mt-4 text-base text-[#5A4E42]">
              The whole point of Mewstro for teachers is that the boring
              admin around getting students up and running on a tool
              shouldn&apos;t fall on you. The toolkit is one piece of that.
              The teacher dashboard, the student invite codes, the weekly
              digest, the directory listing in your area, all of those are
              part of the same idea.
            </p>
            <p className="mt-4 text-base text-[#5A4E42]">
              If you&apos;ve got something specific you&apos;d use, a
              certificate template, a recital programme, an end-of-term
              report, just email me at{" "}
              <a
                href="mailto:mikey@mewstro.com"
                className="font-semibold text-[#2D8B7E] hover:underline"
              >
                mikey@mewstro.com
              </a>
              . I&apos;m building these in response to what teachers
              actually ask for, so the more specific you are, the faster
              it shows up here.
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF6EF] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2D8B7E]">
              On the list
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#5A4E42]">
              <li>· A4 poster for studio walls</li>
              <li>· Email template for parents</li>
              <li>· End-of-term progress certificate</li>
              <li>· Printable lesson-prep sheet</li>
              <li>· Recital programme template</li>
              <li>· Studio social-media starter kit</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-16 text-center">
        <p className="text-sm text-[#6B7280]">
          Not on Mewstro yet?
        </p>
        <Link
          href="/mewstro/pricing"
          className="mt-3 inline-block rounded-full bg-[#2D8B7E] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          Start your 30-day free trial
        </Link>
        <p className="mt-3 text-xs text-[#6B7280]">
          Card required, one reminder email before the first charge, cancel
          in one click.
        </p>
      </div>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8DFD3] bg-white p-5">
      <div className="text-xl text-[#2D8B7E]">{icon}</div>
      <h3 className="mt-2 text-base font-bold text-[#1A1A2E]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5A4E42]">{body}</p>
    </div>
  );
}

function InfoCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#2D8B7E]">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-bold text-[#1A1A2E]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5A4E42]">{body}</p>
    </div>
  );
}
