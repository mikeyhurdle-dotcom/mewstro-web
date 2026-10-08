import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { mewstro } from "@/config/brands";
import {
  HeroSection,
  FeatureGrid,
  ScreenshotCarousel,
  FaqSection,
} from "@/components/shared";
import { MewstroJsonLd } from "@/components/shared/JsonLd";
import type { Feature, Screenshot } from "@/components/shared";

export const metadata: Metadata = {
  title: "Mewstro for solo learners",
  description:
    "Mewstro is a music practice app with a cat mascot who celebrates every session you log. Any instrument, any level, always ad-free. Start free, or unlock everything with Premium at £4.99/mo.",
};

const features: Feature[] = [
  {
    icon: "⏱️",
    title: "Practice timer",
    description:
      "One-tap sessions, tracked by instrument and task type. Scales, sight-reading, repertoire, technique, all logged without the admin overhead.",
  },
  {
    icon: "🔥",
    title: "Streaks & heatmap",
    description:
      "A consecutive-day streak and a 90-day calendar heatmap, so you can see the shape of your practice at a glance rather than just the last session.",
  },
  {
    icon: "🎨",
    title: "Mewstro the cat mascot",
    description:
      "Nine moods, with confetti and floating notes when you&apos;re on form. Mewstro celebrates when you show up and sleeps when you rest, and never guilt-trips you for missing a day.",
  },
  {
    icon: "🎼",
    title: "Repertoire & BPM",
    description:
      "Track every piece you&apos;re learning, from sight-read-through to performance-ready. Log BPM targets as you bring them up, so you can actually see the needle move on the hard sections.",
  },
  {
    icon: "⌚️",
    title: "Apple Watch + widgets",
    description:
      "Start a session from your Watch. Glance a Lock Screen widget. Full Home Screen widget ecosystem if you want it on your main view.",
  },
  {
    icon: "📹",
    title: "Milestone Moments",
    description:
      "Catch the moment a tricky passage finally clicks. Save short video clips and watch your progress compound over time in a library of small wins.",
  },
];

const screenshots: Screenshot[] = [
  {
    src: "/mewstro/screens/practice-timer.png",
    alt: "Practice timer",
    caption: "Track every session",
  },
  {
    src: "/mewstro/screens/calendar-heatmap.png",
    alt: "Calendar heatmap",
    caption: "Build your streak",
  },
  {
    src: "/mewstro/screens/activity-rings.png",
    alt: "Activity rings",
    caption: "See your progress at a glance",
  },
  {
    src: "/mewstro/screens/achievements.png",
    alt: "Achievement unlock",
    caption: "Earn badges along the way",
  },
  {
    src: "/mewstro/screens/repertoire.png",
    alt: "Repertoire list",
    caption: "Organise your repertoire",
  },
  {
    src: "/mewstro/screens/widgets.png",
    alt: "Widgets",
    caption: "Widgets keep you motivated",
  },
];

const faqs = [
  {
    question: "What does Free include?",
    answer:
      "The practice timer, manual session entry, one instrument, a 7-day practice history, the streak counter, a metronome, and Mewstro the mascot with his basic moods. Mewstro stays ad-free whether you&apos;re on Free or Premium. If that&apos;s all you need, Free stays Free.",
  },
  {
    question: "What do I get with Premium?",
    answer:
      "Unlimited instruments, full practice history, Milestone Moment videos, repertoire tracking with BPM, a weekly planner, all the widgets, the Apple Watch app with haptic metronome, Siri Shortcuts, the full nine-mood mascot, themes, and CSV data export. It&apos;s £4.99/mo or £39.99/yr which saves you 33%. Your first 7 days are free via Apple&apos;s Introductory Offer.",
  },
  {
    question: "Does my teacher use Mewstro?",
    answer:
      "If they do, it&apos;s already paid for. Ask them for your studio&apos;s invite code, then tap &lsquo;I have an invite code&rsquo; on first open, paste the code in, and your account unlocks. Students never pay anything when they&apos;re invited by a teacher.",
  },
  {
    question: "What instruments does Mewstro support?",
    answer:
      "Any of them. Piano, guitar, voice, violin, drums, brass, woodwind, and anything else you might be learning. Mewstro is instrument-agnostic and lets you track multiple instruments with custom task types for each.",
  },
  {
    question: "Is my practice data private?",
    answer:
      "Yes. Sessions are stored on your device and synced to your own account. The analytics we use is TelemetryDeck, which is anonymised and privacy-first by design, so there&apos;s nothing that identifies you individually, nothing that tracks your IP, and nothing shared with advertisers anywhere. I don&apos;t sell your data.",
  },
];

function TeacherEscapeHatch() {
  return (
    <section className="bg-[#FFFBF7] px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#2D8B7E]/20 bg-white p-8 md:p-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#2D8B7E]">
              Does your teacher use Mewstro?
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#1A1A2E]">
              If they do, it&apos;s already paid for.
            </h2>
            <p className="mt-3 text-sm text-[#5A4E42]">
              Teacher-invited students get the full Mewstro experience
              free for as long as their teacher is subscribed. Just ask
              your teacher for the studio&apos;s invite code.
            </p>
          </div>
          <Link
            href="/mewstro"
            className="inline-block whitespace-nowrap rounded-full border border-[#2D8B7E] px-5 py-2.5 text-sm font-semibold text-[#2D8B7E] hover:bg-[#2D8B7E]/5"
          >
            I&apos;m a teacher
          </Link>
        </div>
      </div>
    </section>
  );
}

function SoloPricingBand() {
  return (
    <section
      id="pricing"
      className="py-20"
      style={{ backgroundColor: mewstro.colors.surface }}
    >
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[#6B7280]">
            Solo learner pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            Free to start, Premium when you&apos;re ready.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-[#1A1A2E]">Free</h3>
            <p className="mt-2 text-4xl font-bold text-[#1A1A2E]">£0</p>
            <p className="mt-2 text-sm text-[#5A4E42]">
              Everything you need to start a practice habit.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[#5A4E42]">
              <li>✓ Practice timer, manual entry</li>
              <li>✓ 1 instrument</li>
              <li>✓ 7-day practice history</li>
              <li>✓ Daily streak counter</li>
              <li>✓ Mewstro (basic moods)</li>
              <li>✓ Ad-free, always</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-[#2D8B7E] p-8 text-white shadow-2xl">
            <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-[#2D8B7E]">
              Most popular
            </span>
            <h3 className="mt-4 text-2xl font-bold">Premium</h3>
            <p className="mt-2 text-4xl font-bold">
              £4.99
              <span className="text-base font-normal text-white/80">
                {" "}
                / month
              </span>
            </p>
            <p className="mt-1 text-sm text-white/80">
              or £39.99/year, saves you 33%
            </p>
            <p className="mt-3 text-sm text-white/90">
              Everything Mewstro can do. 7-day free trial via Apple.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Unlimited instruments</li>
              <li>✓ Full practice history</li>
              <li>✓ Milestone Moment videos</li>
              <li>✓ Repertoire with BPM</li>
              <li>✓ Apple Watch + all widgets</li>
              <li>✓ Full mascot (9 moods)</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-[#6B7280]">
          Prefer to pay once or see teacher pricing?{" "}
          <Link
            href="/mewstro/pricing"
            className="font-semibold text-[#2D8B7E] hover:underline"
          >
            See all pricing
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function FounderCard() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <Image
            src="/mewstro/mascot.png"
            alt=""
            width={96}
            height={96}
            className="rounded-2xl"
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">
              Built by a piano learner
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#1A1A2E]">
              Started piano at 40. Built the app my teacher inspired.
            </h2>
            <p className="mt-3 text-sm text-[#5A4E42]">
              I&apos;m Mikey. I started piano just before my 40th
              birthday, second time really, the first try at school
              didn&apos;t stick. I built a spreadsheet to track my
              practice because that&apos;s how I work day-to-day, and
              my teacher Ellie saw it and reckoned her other students
              would want something similar.
            </p>
            <Link
              href="/mewstro/story"
              className="mt-4 inline-block text-sm font-semibold text-[#2D8B7E] hover:underline"
            >
              Read the full story →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MewstroSoloPage() {
  return (
    <>
      <MewstroJsonLd />
      <HeroSection brand={mewstro} />
      <FeatureGrid
        brand={mewstro}
        features={features}
        title="Everything you need to practise better"
        subtitle="Practice should feel good. Mewstro is built to make it feel that way, for any instrument and any level."
      />
      <ScreenshotCarousel
        brand={mewstro}
        screenshots={screenshots}
        title="See it in action"
        subtitle="Widgets, Watch, and the mascot, all in one app."
      />
      <FounderCard />
      <TeacherEscapeHatch />
      <SoloPricingBand />
      <FaqSection brand={mewstro} faqs={faqs} />

      {/* Final CTA */}
      <section
        className="py-20 text-center"
        style={{ backgroundColor: mewstro.colors.surface }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            Ready to practise?
          </h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            Download Mewstro free. Upgrade to Premium when you&apos;re
            ready for the full experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={mewstro.links.appStore}
              className="inline-block rounded-full bg-[#2D8B7E] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#246F64]"
            >
              Get Mewstro on the App Store
            </a>
            <Link
              href="/mewstro/pricing"
              className="inline-block rounded-full border border-[#E8DFD3] bg-white px-8 py-4 text-base font-semibold text-[#1A1A2E] hover:bg-[#FAF6EF]"
            >
              See all pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
