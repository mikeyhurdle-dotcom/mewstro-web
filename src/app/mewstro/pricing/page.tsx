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
    description:
      "Up to 25 students in your studio. About 60p per student per month with a full studio.",
    features: [
      "Full teacher dashboard",
      "See every student's practice at a glance",
      "Assignments: set the week's task, watch it get done",
      "Studio Materials: share videos with your whole studio or just the students who need them",
      "Practice reflections: how each session felt, in the student's own words",
      "Practice heatmap and trends per student",
      "Milestone Moment videos from your students",
      "Optional studio leaderboard (off by default for any student who'd rather not)",
      "One invite code that your students redeem inside the app",
      "Every enrolled student gets full Mewstro included",
      "Lesson notes integration (link a Google Doc)",
      "Weekly studio digest email",
      "Email support",
    ],
    highlighted: false,
    cta: "Start your 30-day free trial",
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
    cta: "Start your 30-day free trial",
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
      "Daily practice reminders with smart timing",
      "Metronome (iPhone)",
      "Mewstro the mascot (basic moods)",
      "Ad-free, always",
    ],
  },
  {
    name: "Premium",
    price: "£4.99",
    period: "/ month",
    annual: "or £39.99/year, saves you 33%",
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
    <figure className="rounded-2xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-[#6B7280]">
        From a real studio
      </p>
      <blockquote className="mt-4 text-lg leading-relaxed text-[#1A1A2E]">
        &ldquo;This app is everything that I&apos;d been looking for! It
        allows me to work with my students to put together their practice
        schedule, and creates an inviting space for them to record how well
        they&apos;re able to stick to that schedule. I also love the
        leader-board feature, this really appeals to my more competitive
        students! Highly recommend.&rdquo;
      </blockquote>
      <figcaption className="mt-5">
        <span className="text-sm font-semibold text-[#1A1A2E]">
          Ellie Moorhouse
        </span>
        <span className="ml-2 text-xs text-[#6B7280]">
          EM:CAS, the piano studio Mewstro was built in
        </span>
      </figcaption>
    </figure>
  );
}

export default function MewstroPricingPage() {
  // Stripe checkout is gated on NEXT_PUBLIC_BILLING_ENABLED="true" in Vercel.
  // Without it the tiers fall back to the walkthrough form.
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
              than 25, or 25 and under. Either way it works out around £1
              per student per month or less, against lesson fees of £30 or
              more a week. And it&apos;s student count, not teacher count:
              a school with two or three teachers shares one subscription.
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
                      time from your dashboard. Want a walkthrough first?{" "}
                      <Link
                        href="/mewstro/teachers/apply"
                        className="underline"
                      >
                        Book twenty minutes with me
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
                      Book a walkthrough
                    </Link>
                    <p
                      className={`mt-3 text-xs text-center ${tier.highlighted ? "text-white/70" : "text-[#6B7280]"}`}
                    >
                      Checkout is opening shortly. Book a walkthrough and
                      I&apos;ll set your studio up by hand.
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built with teachers — testimonial slot */}
      {/*
       * This section hosts a real teacher testimonial. Do NOT add placeholder quotes, fabricated names, or
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
              Solo learners can{" "}
              <a
                href="https://apps.apple.com/app/mewstro/id6761615884"
                className="font-semibold text-[#2D8B7E] hover:underline"
              >
                download the app for free
              </a>
              , and unlock everything with Premium. Teacher-invited
              students never see any of this: there&apos;s no upsell
              anywhere in the app for them.
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
              Your teacher generates a code from their dashboard. You{" "}
              <a
                href="https://apps.apple.com/app/mewstro/id6761615884"
                className="font-semibold text-[#2D8B7E] hover:underline"
              >
                download the app
              </a>
              , tap &ldquo;I have an invite code&rdquo; during
              onboarding, paste the code, and your account unlocks.
              Apple handles the redemption behind the scenes, so you
              don&apos;t have to enter any card details.
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
            Rather see it before you start?
          </h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            Book twenty minutes with me. I&apos;ll show you what your
            students see, what lands on your dashboard, and set your studio
            up with you on the call.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mewstro/teachers/apply"
              className="inline-block rounded-full px-8 py-4 text-base font-semibold bg-[#2D8B7E] text-white hover:bg-[#246F64] transition-colors"
            >
              Book a walkthrough
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
