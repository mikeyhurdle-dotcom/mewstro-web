import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButtons } from "@/components/mewstro/CheckoutButtons";
import { formatPriceLabel, isBillingEnabled } from "@/lib/billing/plans";
import type { PlanKey } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Pricing — Mewstro",
  description:
    "Mewstro is built for music teachers and their students. Teachers pay one simple monthly fee and every student in their studio gets full access included. Solo learners can subscribe directly. 30-day teacher trial, 7-day solo trial, honest pricing, easy to cancel.",
};

const teacherTiers: Array<{
  name: string;
  plan: PlanKey;
  price: string;
  period: string;
  annual: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}> = [
  {
    name: "Studio",
    plan: "studio",
    price: "£14.99",
    period: "/ month",
    annual: "or £149/year, saves you £30",
    description: "Up to 25 students in your studio.",
    features: [
      "Full teacher dashboard",
      "See every student's practice at a glance",
      "Studio leaderboard, ranked by weekly minutes",
      "Practice heatmap and trends per student",
      "Milestone Moment videos from your students",
      "One invite code that your students redeem inside the app",
      "Every enrolled student gets full Mewstro included",
      "Lesson notes integration (link a Google Doc)",
      "Weekly studio digest email",
      "Email support",
    ],
    highlighted: false,
    cta: "Apply for Founding Studio access",
  },
  {
    name: "Studio Unlimited",
    plan: "studio_unlimited",
    price: "£24.99",
    period: "/ month",
    annual: "or £249/year, saves you £50",
    description: "Unlimited students. For full-time teaching studios.",
    features: [
      "Everything in Studio",
      "Unlimited students",
      "Priority email support",
      "Early access to new features",
      "Feature requests get higher priority",
    ],
    highlighted: true,
    cta: "Apply for Founding Studio access",
  },
];

const soloTiers = [
  {
    name: "Free",
    price: "£0",
    period: "",
    description: "Everything you need to build a basic practice habit.",
    features: [
      "Practice timer",
      "Manual session entry",
      "1 instrument",
      "7-day practice history",
      "Daily streak counter",
      "Metronome (iPhone)",
      "Mewstro the mascot (basic moods)",
      "Ad-free, always",
    ],
  },
  {
    name: "Premium",
    price: "£6.99",
    period: "/ month",
    annual: "or £59.99/year, saves you 28%",
    description: "Everything Mewstro can do, for solo learners.",
    features: [
      "7-day free trial on first open",
      "Unlimited instruments",
      "Full practice history",
      "Milestone Moment videos",
      "Repertoire with BPM tracking",
      "Weekly planner",
      "Full stats, including heatmap and trends",
      "All 4 widgets + Lock Screen widgets",
      "Apple Watch app + haptic metronome",
      "Siri Shortcuts",
      "Full mascot (all 9 moods)",
      "CSV data export",
    ],
  },
];

const commitments = [
  {
    title: "Your subscription is the only thing paying for this",
    body: "There won&apos;t be banner ads, interstitials, or sponsored practice tips sneaking in. Teacher subscriptions and solo Premium are how I keep the lights on here.",
  },
  {
    title: "Your student data isn&apos;t a product",
    body: "I don&apos;t sell it, share it with music schools, or train any machine learning models on it. It stays with you and your studio.",
  },
  {
    title: "Honest pricing, easy to cancel",
    body: "The 30-day teacher trial ends with a clear reminder email seven days before the first charge. No silent auto-renewal, no hoops to jump through. One-click cancel from your dashboard whenever you need to.",
  },
  {
    title: "One subscription, all your students",
    body: "Every student in your studio gets full Mewstro, up to whatever tier cap you&apos;re on. There&apos;s nothing for students or their parents to pay on top of that.",
  },
  {
    title: "If Mewstro ever has to shut down, you still get your data",
    body: "If things go sideways and I have to close Mewstro down, I&apos;ll ship a full CSV export tool first for every user, free and paid, before anything goes offline. That&apos;s a hard commitment I&apos;ve made to myself and to Ellie.",
  },
];

function BuiltWithTeachersCard() {
  return (
    <div className="rounded-2xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2D8B7E] text-2xl">
          🎹
        </div>
        <div>
          <h3 className="text-lg font-bold">
            This was designed inside a working music studio
          </h3>
          <p className="mt-2 text-sm text-[#5A4E42]">
            Every teacher-facing feature has to pass the &ldquo;would
            Ellie actually use this with her own studio?&rdquo; test
            before it goes out. Ellie Moorhouse is my own piano teacher
            and the founding pilot, and the whole app has been shaped
            by how she actually teaches. Once her studio has been on
            Mewstro for long enough to have a real view on it, her own
            words will live here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MewstroPricingPage() {
  // Stripe checkout ships dark: until NEXT_PUBLIC_BILLING_ENABLED="true" is
  // set in Vercel the page keeps its apply-only CTAs, byte-for-byte.
  const billingEnabled = isBillingEnabled();

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#1A1A2E]">
      {/* Hero */}
      <section className="pt-20 pb-12 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#2D8B7E]">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            Built for teachers.{" "}
            <span className="text-[#2D8B7E]">Works for solo learners too.</span>
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto text-[#6B7280]">
            One teacher subscription covers every student in the studio,
            and solo learners can subscribe directly. I&apos;ve kept the
            pricing simple and the terms honest, nothing hidden and
            nothing clever.
          </p>
        </div>
      </section>

      {/* Teacher tiers (primary) */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] mb-2">
              For music teachers
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Pick your tier by studio size
            </h2>
            <p className="mt-3 text-[#6B7280]">
              Basically comes down to how many students you teach. More
              than 25, or 25 and under.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teacherTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-3xl p-8 flex flex-col ${
                  tier.highlighted
                    ? "bg-[#2D8B7E] text-white shadow-2xl scale-[1.02]"
                    : "bg-white shadow-sm border border-[#E8DFD3]"
                }`}
              >
                {tier.highlighted && (
                  <span className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 bg-white text-[#2D8B7E]">
                    Growing studios
                  </span>
                )}
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  <span
                    className={`text-sm ${tier.highlighted ? "text-white/80" : "text-[#6B7280]"}`}
                  >
                    {tier.period}
                  </span>
                </div>
                <p
                  className={`mt-1 text-sm ${tier.highlighted ? "text-white/80" : "text-[#6B7280]"}`}
                >
                  {tier.annual}
                </p>
                <p
                  className={`mt-3 text-base ${tier.highlighted ? "text-white/90" : "text-[#5A4E42]"}`}
                >
                  {tier.description}
                </p>

                <ul className="mt-8 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span
                        className={`mt-0.5 text-base ${tier.highlighted ? "text-white" : "text-[#2D8B7E]"}`}
                      >
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {billingEnabled ? (
                  <>
                    <CheckoutButtons
                      plan={tier.plan}
                      monthlyLabel={formatPriceLabel(tier.plan, "month")}
                      annualLabel={formatPriceLabel(tier.plan, "year")}
                      highlighted={tier.highlighted}
                    />
                    <p
                      className={`mt-3 text-xs text-center ${tier.highlighted ? "text-white/70" : "text-[#6B7280]"}`}
                    >
                      Card required, first charge on day 31, cancel any
                      time from your dashboard. After a Founding Studio
                      slot instead?{" "}
                      <Link
                        href="/mewstro/teachers/apply"
                        className="underline"
                      >
                        Apply here
                      </Link>
                      .
                    </p>
                  </>
                ) : (
                  <>
                    <Link
                      href="/mewstro/teachers/apply"
                      className={`mt-8 block rounded-xl px-5 py-4 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                        tier.highlighted
                          ? "bg-white text-[#2D8B7E]"
                          : "bg-[#2D8B7E] text-white"
                      }`}
                    >
                      {tier.cta}
                    </Link>
                    <p
                      className={`mt-3 text-xs text-center ${tier.highlighted ? "text-white/70" : "text-[#6B7280]"}`}
                    >
                      Applications reviewed personally. Founding Studio rate
                      gets you 50% off for life, first five studios only.
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiered founding comparison */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] mb-2">
              The first 100 teachers
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Three ways to join early
            </h2>
            <p className="mt-3 text-[#6B7280] max-w-2xl mx-auto">
              I&apos;m opening the door in tiers. The earlier you come in,
              the better the deal and the more say you have on where
              Mewstro goes next.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl bg-[#2D8B7E] p-7 text-white shadow-2xl scale-[1.02]">
              <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-[#2D8B7E]">
                First 5
              </span>
              <h3 className="mt-4 text-2xl font-bold">Founding Studios</h3>
              <p className="mt-2 text-3xl font-bold">50% off for life</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li>✓ Locked half-price forever</li>
                <li>✓ Direct WhatsApp with me</li>
                <li>✓ Quarterly roadmap call</li>
                <li>✓ Founding Teacher badge on site &amp; in-app</li>
                <li>✓ First say on features</li>
              </ul>
              <p className="mt-6 text-xs text-white/80">
                Application plus a personal call. 1 of 5 reserved for
                Ellie.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm border border-[#E8DFD3]">
              <span className="inline-block rounded-full bg-[#2D8B7E]/10 px-3 py-1 text-xs font-bold uppercase text-[#2D8B7E]">
                Next 20
              </span>
              <h3 className="mt-4 text-2xl font-bold">Early Access</h3>
              <p className="mt-2 text-3xl font-bold">Price locked 2 years</p>
              <ul className="mt-6 space-y-3 text-sm text-[#5A4E42]">
                <li>✓ Standard 30-day free trial</li>
                <li>✓ Today&apos;s price locked for 2 years</li>
                <li>✓ Early Access Teacher badge</li>
                <li>✓ Priority email support</li>
              </ul>
              <p className="mt-6 text-xs text-[#6B7280]">
                Opens once the Founding cohort is full. Closes once
                teacher #25 is in.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm border border-[#E8DFD3]">
              <span className="inline-block rounded-full bg-[#FAF6EF] px-3 py-1 text-xs font-bold uppercase text-[#6B7280]">
                From #26
              </span>
              <h3 className="mt-4 text-2xl font-bold">Standard</h3>
              <p className="mt-2 text-3xl font-bold">30-day trial</p>
              <ul className="mt-6 space-y-3 text-sm text-[#5A4E42]">
                <li>✓ Standard monthly / annual pricing</li>
                <li>✓ 30-day free trial</li>
                <li>✓ Email support</li>
                <li>✓ Self-serve onboarding</li>
              </ul>
              <p className="mt-6 text-xs text-[#6B7280]">
                The normal self-serve experience, open once the first 25
                teachers are in.
              </p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/mewstro/teachers/apply"
              className="inline-block rounded-full bg-[#1A1A2E] px-7 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Apply for a Founding Studio slot →
            </Link>
          </div>
        </div>
      </section>

      {/* Built with teachers — testimonial slot */}
      {/*
       * This section is structured to host a real teacher testimonial once
       * our founding pilot studio has been using Mewstro for long enough
       * to give one. Do NOT add placeholder quotes, fabricated names, or
       * "Coming Soon" testimonials here (see Phase B rule: every quote on
       * this page has to come from a real teacher who has opted in).
       *
       * To add a real testimonial, replace the <BuiltWithTeachers /> card
       * below with a quote card containing the teacher's words, their
       * first name, their studio name, and ideally a photo.
       */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <BuiltWithTeachersCard />
        </div>
      </section>

      {/* Solo tiers (secondary) */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[#6B7280] mb-2">
              No teacher?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              You can still use Mewstro
            </h2>
            <p className="mt-3 text-[#6B7280]">
              Solo learners can download the app for free, and unlock
              everything with Premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {soloTiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-3xl p-8 bg-white shadow-sm border border-[#E8DFD3] flex flex-col"
              >
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-sm text-[#6B7280]">
                      {tier.period}
                    </span>
                  )}
                </div>
                {tier.annual && (
                  <p className="mt-1 text-sm text-[#6B7280]">{tier.annual}</p>
                )}
                <p className="mt-3 text-base text-[#5A4E42]">
                  {tier.description}
                </p>
                <ul className="mt-8 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="mt-0.5 text-base text-[#2D8B7E]">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher-invited students callout */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-[#2D8B7E]/5 border border-[#2D8B7E]/20 p-8 md:p-10">
            <h2 className="text-2xl font-bold">
              If your teacher uses Mewstro, it&apos;s already paid for
            </h2>
            <p className="mt-4 text-base text-[#5A4E42]">
              Teacher-invited students get the full Mewstro experience
              plus their studio layer (leaderboard, teacher-set
              challenges, assignment inbox), all completely free for as
              long as their teacher is subscribed. Just ask your teacher
              for the invite code and redeem it during onboarding in the
              app.
            </p>
            <div className="mt-6 rounded-xl bg-white border border-[#E8DFD3] p-4 text-sm text-[#6B7280]">
              <strong className="text-[#1A1A2E]">How it works:</strong>{" "}
              Your teacher generates a code from their dashboard. You
              download the app, tap &ldquo;I have an invite code&rdquo;
              during onboarding, paste the code, and your account
              unlocks. Apple handles the redemption behind the scenes,
              so you don&apos;t have to enter any card details.
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">
              A few things I&apos;ve decided on
            </h2>
            <p className="mt-3 text-base text-[#6B7280]">
              These aren&apos;t marketing promises, they&apos;re things
              I&apos;ve decided on and aren&apos;t changing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {commitments.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl bg-white p-6 border border-[#E8DFD3]"
              >
                <h3
                  className="text-lg font-bold mb-2 text-[#2D8B7E]"
                  dangerouslySetInnerHTML={{ __html: c.title }}
                />
                <p
                  className="text-sm leading-relaxed text-[#5A4E42]"
                  dangerouslySetInnerHTML={{ __html: c.body }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 text-center bg-white border-t border-[#E8DFD3]">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold">
            Want to be one of the first 5 studios?
          </h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            Founding Studios get 50% off for life, a direct line to me,
            and first say on where Mewstro goes next. Five spots, by
            application only.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mewstro/teachers/apply"
              className="inline-block rounded-full px-8 py-4 text-base font-semibold bg-[#2D8B7E] text-white hover:bg-[#246F64] transition-colors"
            >
              Apply for Founding Studio access
            </Link>
            <Link
              href="/mewstro"
              className="inline-block rounded-full px-8 py-4 text-base font-semibold border border-[#E8DFD3] text-[#1A1A2E] bg-white hover:bg-[#FAF6EF] transition-colors"
            >
              Back to overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
