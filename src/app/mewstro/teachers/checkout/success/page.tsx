import type { Metadata } from "next";
import Link from "next/link";
import { getStripe } from "@/lib/billing/stripe";
import { isPlanKey, PLANS } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "You're in — Mewstro",
  description: "Your Mewstro teacher trial has started.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SessionSummary {
  planLabel: string | null;
  email: string | null;
  trialEndsAt: Date | null;
}

/**
 * Best-effort lookup of the just-completed Checkout Session so the page can
 * say something specific. Any failure degrades to the generic copy — the
 * webhook, not this page, is what actually records the subscription.
 */
async function loadSessionSummary(
  sessionId: string | undefined,
): Promise<SessionSummary> {
  const empty: SessionSummary = {
    planLabel: null,
    email: null,
    trialEndsAt: null,
  };
  if (!sessionId || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) return empty;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const metaPlan = session.metadata?.mewstro_plan;
    const subscription =
      typeof session.subscription === "object" ? session.subscription : null;
    return {
      planLabel: isPlanKey(metaPlan) ? PLANS[metaPlan].label : null,
      email: session.customer_details?.email ?? null,
      trialEndsAt: subscription?.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    };
  } catch {
    return empty;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const summary = await loadSessionSummary(session_id);

  const trialEndLabel = summary.trialEndsAt
    ? summary.trialEndsAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#1A1A2E]">
      <section className="px-6 pt-24 pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D8B7E] text-3xl">
            🎉
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Welcome to Mewstro{summary.planLabel ? ` ${summary.planLabel}` : ""}
          </h1>
          <p className="mt-6 text-lg text-[#6B7280]">
            Your 30-day free trial has started
            {trialEndLabel
              ? ` — nothing is charged until ${trialEndLabel}`
              : " — nothing is charged for 30 days"}
            . I&apos;ll email you a reminder a week before the first charge,
            and you can cancel any time from your dashboard with one click.
          </p>
          {summary.email && (
            <p className="mt-3 text-sm text-[#6B7280]">
              A welcome email with the details is on its way to{" "}
              <strong className="text-[#1A1A2E]">{summary.email}</strong>.
            </p>
          )}

          <div className="mt-10 rounded-3xl border border-[#E8DFD3] bg-white p-8 text-left shadow-sm">
            <h2 className="text-lg font-bold">What happens next</h2>
            <ol className="mt-4 space-y-3 text-sm text-[#5A4E42]">
              <li>
                <strong>1.</strong> I&apos;ll set up your studio dashboard and
                send your sign-in details within one working day (usually much
                faster).
              </li>
              <li>
                <strong>2.</strong> You&apos;ll get one invite code — your
                students redeem it inside the Mewstro app and their full access
                is included in your plan.
              </li>
              <li>
                <strong>3.</strong> Practice starts showing up on your
                dashboard the moment your first student logs a session.
              </li>
            </ol>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/mewstro"
              className="inline-block rounded-full bg-[#2D8B7E] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#246F64]"
            >
              Back to mewstro.com
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#6B7280]">
            Your studio dashboard link and sign-in details arrive with your
            setup email — no need to do anything until then.
          </p>

          <p className="mt-10 text-sm text-[#6B7280]">
            Questions, or anything not working? Email me directly at{" "}
            <a
              href="mailto:mikey@mewstro.com"
              className="font-semibold text-[#2D8B7E]"
            >
              mikey@mewstro.com
            </a>{" "}
            — it lands in my actual inbox.
          </p>
        </div>
      </section>
    </div>
  );
}
