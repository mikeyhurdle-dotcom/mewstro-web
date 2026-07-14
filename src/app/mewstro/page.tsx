import Link from "next/link";
import Image from "next/image";
import { mewstro } from "@/config/brands";
import { FOUNDING_SLOTS_LEFT } from "@/config/founding";
import { ScreenshotCarousel, FaqSection } from "@/components/shared";
import { MewstroJsonLd, FaqJsonLd } from "@/components/shared/JsonLd";
import type { Screenshot } from "@/components/shared";

const TEAL = "#2D8B7E";

const screenshots: Screenshot[] = [
  {
    src: "/mewstro/screens/practice-timer.png",
    alt: "Practice timer",
    caption: "One-tap sessions",
  },
  {
    src: "/mewstro/screens/calendar-heatmap.png",
    alt: "Calendar heatmap",
    caption: "Streak visibility",
  },
  {
    src: "/mewstro/screens/activity-rings.png",
    alt: "Activity rings",
    caption: "Daily activity",
  },
  {
    src: "/mewstro/screens/repertoire.png",
    alt: "Repertoire list",
    caption: "Track pieces with BPM",
  },
  {
    src: "/mewstro/screens/achievements.png",
    alt: "Achievement unlock",
    caption: "Gentle gamification",
  },
  {
    src: "/mewstro/screens/widgets.png",
    alt: "Home screen widgets",
    caption: "Widgets and Watch",
  },
];

const faqs = [
  {
    question: "How does the teacher subscription work?",
    answer:
      "You pay a simple monthly fee. £14.99/mo covers up to 25 students, £24.99/mo is unlimited. Every student you invite gets full Mewstro included, and students never pay anything while they're part of your studio. Annual plans save around 17% if you'd rather pay once a year.",
  },
  {
    question: "What does Mewstro actually do for my studio?",
    answer:
      "You see every student's practice activity in one dashboard. Who's been practising, for how long, on what. A weekly digest email lands on a Sunday so you don't even have to log in just to know what's going on. There's a studio leaderboard ranked by weekly minutes, which you can toggle off per-student or for the whole studio, but it's consistently cited as the single biggest driver of students actually practising. An assignment system so your students have a clear to-do list between lessons. And Milestone Moment videos from your students whenever a tricky passage finally clicks.",
  },
  {
    question: "Why do I need to apply, why can't I just subscribe?",
    answer:
      "Mewstro has just finished its founding pilot with Ellie Moorhouse, my own teacher, so I know it works in a real studio. The founding round is now open. The first five Founding Studios are hand-picked, with a personal conversation, 50% off for life, and direct input on where the product goes next. After those five, the next twenty join as Early Access at standard pricing and the standard 30-day trial, with their price locked in for two years, a Founding badge, and priority support. Once teacher #25 is in, it's standard self-serve signup.",
  },
  {
    question: "What instruments are supported?",
    answer:
      "All of them. Mewstro is instrument-agnostic. Piano, voice, guitar, violin, drums, brass, woodwinds, and anything else you might teach. Each instrument has its own custom task types (scales, sight-reading, repertoire, technique, improvisation, and so on) so students can log the right kind of practice for what they're actually working on.",
  },
  {
    question: "Have students on Android?",
    answer:
      "They can use the student portal — share your invite link and they can log practice, keep a streak, complete assignments, and show up on your studio leaderboard from the browser on any phone. The full native experience is on iPhone, with Android on the roadmap.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Your students keep full Mewstro access for 30 days after you cancel, and then drop to the Free tier. Their practice data stays on their devices regardless, nothing gets deleted. You can resubscribe at any point and everyone's access comes straight back.",
  },
  {
    question: "Is student practice data private?",
    answer:
      "Yes. Practice data is stored on each student's device and synced to their own account. The analytics we use is TelemetryDeck, which is anonymised and privacy-first by design, so there's nothing that identifies individuals, nothing that tracks IPs, and nothing that links across apps. I don't sell your data or your students' data, anywhere.",
  },
];

function FoundingStrip() {
  return (
    <section
      className="px-6 py-6"
      style={{ backgroundColor: `${TEAL}0d` }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: TEAL }}
          >
            ✦
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1A1A2E]">
              The founding round is open — {FOUNDING_SLOTS_LEFT} of 5 Founding
              Studios left.
            </p>
            <p className="text-xs text-[#5A4E42]">
              50% off for life, a direct line to me, and first say on where
              the product goes. Hand-picked, by application.
            </p>
          </div>
        </div>
        <Link
          href="/mewstro/teachers/apply"
          className="inline-block rounded-full bg-[#1A1A2E] px-5 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Apply for a slot →
        </Link>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: mewstro.colors.background }}
    >
      <div
        className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: mewstro.colors.primary }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: TEAL }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          {/* Copy */}
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${TEAL}1a`,
                color: TEAL,
              }}
            >
              For music teachers
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1A1A2E] md:text-6xl">
              See who practised this week.
              <br />
              Who didn&apos;t.
              <br />
              <span style={{ color: TEAL }}>Who&apos;s on fire.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#5A4E42] md:text-xl">
              A music practice app your whole studio uses. One teacher
              subscription covers every student you invite, with the
              leaderboard, heatmaps, milestone videos and weekly digest all
              included. Students never pay a thing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/mewstro/teachers/apply"
                className="inline-block rounded-full px-7 py-3.5 text-base font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: TEAL }}
              >
                Apply for Founding Studio access
              </Link>
              <Link
                href="#how-it-works"
                className="inline-block rounded-full border border-[#E8DFD3] bg-white px-7 py-3.5 text-base font-semibold text-[#1A1A2E] hover:bg-[#FAF6EF]"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-[#5A4E42]">
              Built by{" "}
              <Link
                href="/mewstro/story"
                className="font-semibold underline decoration-dotted underline-offset-4 hover:text-[#1A1A2E]"
              >
                Mikey, who started piano at 40
              </Link>
              , alongside his piano teacher Ellie Moorhouse.
            </p>
          </div>

          {/* Mock dashboard preview — styled to look like the real teacher dashboard */}
          <div className="relative">
            <div className="rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-[#E8DFD3]">
              <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-3">
                <div>
                  <p className="text-xs font-medium" style={{ color: TEAL }}>
                    Ellie Moorhouse
                  </p>
                  <p className="text-lg font-bold text-[#1A1A2E]">
                    Ellie Moorhouse&apos;s Studio
                  </p>
                </div>
                <div className="rounded-lg border border-[#E8DFD3] bg-[#FAF6EF] px-3 py-1.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B7280]">
                    Invite code
                  </p>
                  <p
                    className="font-mono text-sm font-bold"
                    style={{ color: TEAL }}
                  >
                    ELLIE
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                <MiniStat label="Students" value="7" />
                <MiniStat label="Active wk" value="6" accent />
                <MiniStat label="Mins wk" value="18h" />
                <MiniStat label="Avg" value="2h 34m" />
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#E8DFD3]">
                <div className="flex items-center justify-between bg-[#FAF6EF] px-4 py-2 text-[11px] uppercase tracking-wider text-[#6B7280]">
                  <span>Student</span>
                  <span>This week</span>
                </div>
                <MockRow
                  name="Isla"
                  rank={1}
                  minutes="4h 20m"
                  streak={12}
                  status="🔥"
                />
                <MockRow
                  name="Freddie"
                  rank={2}
                  minutes="3h 15m"
                  streak={7}
                  status="✅"
                />
                <MockRow
                  name="Maya"
                  rank={3}
                  minutes="2h 40m"
                  streak={5}
                  status="✅"
                />
                <MockRow
                  name="Alex"
                  rank={4}
                  minutes="1h 55m"
                  streak={3}
                  status="🌱"
                />
                <MockRow
                  name="Sam"
                  rank={5}
                  minutes="45m"
                  streak={1}
                  status="🌱"
                  subtle
                />
                <MockRow
                  name="Jordan"
                  rank={6}
                  minutes="0m"
                  streak={0}
                  status="💤"
                  subtle
                />
              </div>
            </div>

            {/* Floating mascot */}
            <div className="absolute -bottom-6 -left-6 hidden md:block">
              <Image
                src="/mewstro/mascot-conducting.png"
                alt=""
                width={120}
                height={120}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#E8DFD3] bg-[#FFFBF7] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6B7280]">
        {label}
      </p>
      <p
        className="mt-0.5 text-lg font-bold"
        style={{ color: accent ? TEAL : "#1A1A2E" }}
      >
        {value}
      </p>
    </div>
  );
}

function MockRow({
  name,
  rank,
  minutes,
  streak,
  status,
  subtle,
}: {
  name: string;
  rank: number;
  minutes: string;
  streak: number;
  status: string;
  subtle?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t border-[#E8DFD3] px-4 py-2.5 text-sm ${
        subtle ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: `${TEAL}1a`,
            color: TEAL,
          }}
        >
          {rank}
        </span>
        <span className="font-medium text-[#1A1A2E]">{name}</span>
        {streak > 0 && (
          <span className="text-xs text-[#6B7280]">
            🔥 {streak}d
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-[#1A1A2E]">{minutes}</span>
        <span>{status}</span>
      </div>
    </div>
  );
}

function DashboardTour() {
  const panels = [
    {
      icon: "🏆",
      title: "Studio leaderboard",
      body: "Weekly ranking by practice minutes. It&apos;s consistently cited as the single biggest driver of students actually practising, which tracks with what I&apos;ve seen. Toggleable per student if you&apos;d rather not show rankings.",
    },
    {
      icon: "📈",
      title: "Per-student heatmap",
      body: "90-day calendar at a glance. Spot the student who was on fire and then dropped off, and the one quietly building a 40-day streak without making a fuss.",
    },
    {
      icon: "📝",
      title: "Assignments",
      body: "Set a task like &ldquo;work on bars 12&ndash;24, 15 min/day&rdquo; and pick which students it applies to. Their practice log auto-credits as they get the work done.",
    },
    {
      icon: "📹",
      title: "Milestone Moments",
      body: "Students capture a short video whenever a tricky passage finally clicks. You see every one of those breakthroughs in their detail view, so the whole year&apos;s wins are there to look back on.",
    },
    {
      icon: "📨",
      title: "Weekly digest email",
      body: "Every Sunday you get an email with the week&apos;s picture. Who&apos;s been practising, who hasn&apos;t, total studio minutes, and a couple of nudge links for anyone who needs a gentle poke. Means you don&apos;t have to log in just to know what&apos;s going on.",
    },
    {
      icon: "🔗",
      title: "One invite code",
      body: "One code covers your whole studio. Your students tap &lsquo;I have a code&rsquo; during onboarding and their Mewstro unlocks. Apple handles the redemption bit behind the scenes, so none of them have to enter card details or anything like that.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="px-6 py-20 md:py-28"
      style={{ backgroundColor: mewstro.colors.surface }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[#6B7280]">
            What your studio sees
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            Everything a busy music teacher actually needs.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#5A4E42]">
            Six things I&apos;ve seen actually shift how students practise.
            I&apos;ve deliberately kept it to that, so there&apos;s nothing
            else cluttering up your view.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {panels.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-[#E8DFD3] bg-white p-6 shadow-sm"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${TEAL}1a` }}
              >
                {p.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1A1A2E]">
                {p.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed text-[#5A4E42]"
                dangerouslySetInnerHTML={{ __html: p.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FoundingProofBand() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs uppercase tracking-wider text-[#6B7280]">
          From the founding studios
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <figure className="flex flex-col rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
            <blockquote className="text-lg leading-relaxed text-[#1A1A2E]">
              &ldquo;This app is everything that I&apos;d been looking for! It
              allows me to work with my students to put together their practice
              schedule, and creates an inviting space for them to record how
              well they&apos;re able to stick to that schedule. I also love the
              leader-board feature, this really appeals to my more competitive
              students! Highly recommend.&rdquo;
            </blockquote>
            <figcaption className="mt-5">
              <span className="text-sm font-semibold text-[#1A1A2E]">
                Ellie Moorhouse
              </span>
              <span className="ml-2 text-xs text-[#6B7280]">
                EM:CAS — Founding Studio #1
              </span>
            </figcaption>
          </figure>
          <figure className="flex flex-col rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
            <blockquote className="text-lg leading-relaxed text-[#1A1A2E]">
              &ldquo;Overall Mewstro has given me a clearer understanding of my
              students&apos; activity in between lessons. It has allowed me
              greater ease of sharing learning materials with my students and
              has enabled me to have a source of contact which was missing
              before using the app.&rdquo;
            </blockquote>
            <figcaption className="mt-5">
              <span className="text-sm font-semibold text-[#1A1A2E]">
                Josh Ingram
              </span>
              <span className="ml-2 text-xs text-[#6B7280]">
                Founding Studio #2
              </span>
            </figcaption>
            <Link
              href="/mewstro/case-study"
              className="mt-4 inline-block text-sm font-semibold text-[#2D8B7E] hover:underline"
            >
              Read Josh&apos;s first four weeks →
            </Link>
          </figure>
        </div>
      </div>
    </section>
  );
}

function StudentSideBand() {
  return (
    <section
      className="px-6 py-16"
      style={{ backgroundColor: mewstro.colors.background }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs uppercase tracking-wider text-[#6B7280]">
          What your students see
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[#1A1A2E] md:text-4xl">
          The full app, included in your subscription.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[#5A4E42]">
          Timer, repertoire tracking, streaks, widgets, Apple Watch support,
          Milestone Moments, and Mewstro the mascot in all nine of his
          moods. Basically everything Mewstro can do. Students never get
          shown an upsell anywhere in the app.
        </p>
      </div>
    </section>
  );
}

function FounderBand() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-8 md:p-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <Image
            src="/mewstro/mascot-celebrating.png"
            alt=""
            width={96}
            height={96}
            className="flex-shrink-0"
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">
              Why I built this
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#1A1A2E]">
              Started piano at 40. Built the app my teacher inspired.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5A4E42]">
              I&apos;m Mikey. I started piano just before my 40th birthday,
              second time really, the first try at school didn&apos;t
              stick. I built a spreadsheet to track my practice because I
              work in professional services and tracking time is muscle
              memory for me. My teacher Ellie saw it. That&apos;s pretty
              much how Mewstro began.
            </p>
            <Link
              href="/mewstro/story"
              className="mt-4 inline-block text-sm font-semibold"
              style={{ color: TEAL }}
            >
              Read the full story →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommitmentsBand() {
  const commitments = [
    {
      title: "Your subscription is the only thing paying for this",
      body: "There won&apos;t be banner ads, interstitials, or sponsored practice tips sneaking in. Teacher subscriptions and solo Premium are how I keep the lights on here.",
    },
    {
      title: "Your student data isn&apos;t a product",
      body: "I don&apos;t sell it, share it, or train any machine learning models on it. It stays with you and your studio.",
    },
    {
      title: "Honest pricing, easy to cancel",
      body: "Clear trial terms, a single reminder email before the first charge, and a one-click cancel from your billing portal whenever you want. If something changes on the pricing side, you&apos;ll hear about it from me before it hits your card.",
    },
    {
      title: "One subscription, all your students",
      body: "Every student in your studio gets full Mewstro, up to whatever tier cap you&apos;re on. There&apos;s nothing for students or their parents to pay on top of that.",
    },
    {
      title: "If Mewstro ever has to shut down, you still have your data",
      body: "If things go sideways and I have to close it all down, I&apos;ll ship a full CSV export tool first for everyone, free and paid users both, before anything goes offline. That&apos;s a hard commitment.",
    },
    {
      title: "Ellie shapes what actually ships",
      body: "Every teacher-facing feature has to pass the &ldquo;would Ellie actually use this with her studio?&rdquo; test before it goes out. This thing has been designed inside a working music studio, and that&apos;s not going to change.",
    },
  ];

  return (
    <section className="bg-[#FFFBF7] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[#6B7280]">
            What never changes
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            A few things I&apos;ve decided on, that aren&apos;t changing.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {commitments.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-[#E8DFD3] bg-white p-6"
            >
              <h3
                className="text-base font-bold"
                style={{ color: TEAL }}
                dangerouslySetInnerHTML={{ __html: c.title }}
              />
              <p
                className="mt-2 text-sm leading-relaxed text-[#5A4E42]"
                dangerouslySetInnerHTML={{ __html: c.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  return (
    <section id="pricing" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[#6B7280]">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            Pick the tier that fits your studio.
          </h2>
          <p className="mt-3 text-sm text-[#5A4E42]">
            Basically comes down to how many students you teach. More than
            25, or 25 and under.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Studio */}
          <div className="rounded-3xl border border-[#E8DFD3] bg-white p-8">
            <h3 className="text-xl font-bold text-[#1A1A2E]">Studio</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold">£14.99</span>
              <span className="text-sm text-[#6B7280]">/ month</span>
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">
              or £149/year, saves you £30
            </p>
            <p className="mt-3 text-sm text-[#5A4E42]">
              Up to 25 students in your studio. Every enrolled student gets
              full Mewstro included.
            </p>
            <div className="mt-6 rounded-xl bg-[#FAF6EF] p-4 text-xs text-[#6B7280]">
              <strong className="text-[#1A1A2E]">Founding Studio rate:</strong>{" "}
              £7.49/mo for life (50% off) for the first 10 studios in.
            </div>
          </div>

          {/* Studio Unlimited */}
          <div
            className="rounded-3xl p-8 text-white shadow-2xl"
            style={{ backgroundColor: TEAL }}
          >
            <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-[#2D8B7E]">
              Growing studios
            </span>
            <h3 className="mt-4 text-xl font-bold">Studio Unlimited</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold">£24.99</span>
              <span className="text-sm text-white/80">/ month</span>
            </div>
            <p className="mt-1 text-xs text-white/80">
              or £249/year, saves you £50
            </p>
            <p className="mt-3 text-sm text-white/90">
              Unlimited students, priority support, and early access to new
              features as I&apos;m building them.
            </p>
            <div className="mt-6 rounded-xl bg-white/10 p-4 text-xs text-white/90">
              <strong className="text-white">Founding Studio rate:</strong>{" "}
              £12.49/mo for life (50% off) for the first 10 studios in.
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/mewstro/pricing"
            className="text-sm font-semibold hover:underline"
            style={{ color: TEAL }}
          >
            See full pricing + founding tier comparison →
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      className="px-6 py-20 text-center"
      style={{ backgroundColor: mewstro.colors.surface }}
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold text-[#1A1A2E] md:text-4xl">
          The founding round is open. {FOUNDING_SLOTS_LEFT} of 5 spots left.
        </h2>
        <p className="mt-4 text-base text-[#5A4E42]">
          50% off for life, a direct line to me, and first say on where
          Mewstro goes next. Apply now and I&apos;ll speak to you
          personally — they&apos;re going fast.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/mewstro/teachers/apply"
            className="inline-block rounded-full px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: TEAL }}
          >
            Apply for Founding Studio access
          </Link>
          <Link
            href="/mewstro/teachers/assets"
            className="inline-block rounded-full border border-[#E8DFD3] bg-white px-8 py-4 text-base font-semibold text-[#1A1A2E] hover:bg-[#FAF6EF]"
          >
            See the Studio toolkit
          </Link>
        </div>
        <p className="mt-4 text-xs text-[#6B7280]">
          Or browse the rollout pack we generate for every studio, no
          sign-up needed.
        </p>
      </div>
    </section>
  );
}

function SoloEscape() {
  return (
    <section className="bg-[#FFFBF7] px-6 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm text-[#6B7280]">
          Not a teacher? Mewstro for solo learners lives{" "}
          <Link
            href="/mewstro/app"
            className="font-semibold hover:underline"
            style={{ color: TEAL }}
          >
            here
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export default function MewstroTeacherHomePage() {
  return (
    <>
      <MewstroJsonLd />
      <FaqJsonLd faqs={faqs} />
      <Hero />
      <FoundingStrip />
      <DashboardTour />
      <FoundingProofBand />
      <StudentSideBand />
      <ScreenshotCarousel
        brand={mewstro}
        screenshots={screenshots}
        title=""
        subtitle=""
      />
      <FounderBand />
      <CommitmentsBand />
      <PricingPreview />
      <FaqSection brand={mewstro} faqs={faqs} />
      <FinalCTA />
      <SoloEscape />
    </>
  );
}
