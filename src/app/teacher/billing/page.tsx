import { getActiveStudioName } from "@/lib/teacher-auth";
import { getServerSupabase } from "@/lib/supabase";
import {
  formatPriceLabel,
  isBillingEnabled,
  isBillingInterval,
  isPlanKey,
  PLANS,
} from "@/lib/billing/plans";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Studio billing page. Shows the current subscription state from
 * mewstro_studio_subscriptions (kept in sync by the Stripe webhook) and
 * hands everything sensitive — card updates, invoices, cancellation — to
 * the Stripe Billing Portal via POST /api/billing/portal.
 */

export const dynamic = "force-dynamic";

interface SubscriptionRow {
  plan: string | null;
  billing_interval: string | null;
  status: string;
  founding: boolean;
  dunning: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const STATUS_LABELS: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
  trialing: { label: "Free trial", tone: "ok" },
  active: { label: "Active", tone: "ok" },
  past_due: { label: "Payment problem", tone: "warn" },
  unpaid: { label: "Payment failed", tone: "bad" },
  canceled: { label: "Cancelled", tone: "bad" },
  paused: { label: "Paused", tone: "warn" },
  incomplete: { label: "Setting up", tone: "warn" },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TeacherBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const studioName = await getActiveStudioName();
  if (!studioName) redirect("/teacher/login");

  const { error } = await searchParams;

  const supabase = getServerSupabase();
  const { data: studio } = await supabase
    .from("mewstro_studios")
    .select("id, studio_name")
    .eq("studio_name", studioName)
    .maybeSingle();

  let subscription: SubscriptionRow | null = null;
  if (studio) {
    const { data } = await supabase
      .from("mewstro_studio_subscriptions")
      .select(
        "plan, billing_interval, status, founding, dunning, trial_ends_at, current_period_end, cancel_at_period_end",
      )
      .eq("studio_id", studio.id)
      .maybeSingle();
    subscription = data;
  }

  const billingEnabled = isBillingEnabled();
  const status = subscription
    ? (STATUS_LABELS[subscription.status] ?? {
        label: subscription.status,
        tone: "warn" as const,
      })
    : null;

  const planLabel =
    subscription && isPlanKey(subscription.plan)
      ? PLANS[subscription.plan].label
      : null;
  const priceLabel =
    subscription &&
    isPlanKey(subscription.plan) &&
    isBillingInterval(subscription.billing_interval)
      ? formatPriceLabel(subscription.plan, subscription.billing_interval, {
          foundingDiscount: subscription.founding,
        })
      : null;

  const trialEnds = formatDate(subscription?.trial_ends_at ?? null);
  const periodEnd = formatDate(subscription?.current_period_end ?? null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-sm text-[#6B7280]">{studioName}</p>

      {error && (
        <div className="mt-6 rounded-xl border border-[#E17055]/40 bg-[#E17055]/10 p-4 text-sm text-[#8A3A24]">
          {error === "no-subscription"
            ? "There's no Stripe subscription linked to this studio yet — if that seems wrong, email mikey@mewstro.com and I'll sort it."
            : "Something went wrong opening the billing portal. Try again in a minute, or email mikey@mewstro.com."}
        </div>
      )}

      {!subscription ? (
        <div className="mt-8 rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold">No subscription yet</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A4E42]">
            This studio isn&apos;t on a paid plan — you&apos;re likely on a
            pilot or Founding Studio arrangement handled directly with Mikey.
            When it&apos;s time to set up billing, it starts from the pricing
            page with a 30-day free trial.
          </p>
          <div className="mt-6">
            <Link
              href="/mewstro/pricing"
              className="inline-block rounded-full bg-[#2D8B7E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#246F64]"
            >
              See plans and pricing
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold">
                {planLabel ?? "Teacher plan"}
              </h2>
              {status && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    status.tone === "ok"
                      ? "bg-[#2D8B7E]/10 text-[#2D8B7E]"
                      : status.tone === "warn"
                        ? "bg-[#FFF9E0] text-[#B8860B]"
                        : "bg-[#E17055]/10 text-[#8A3A24]"
                  }`}
                >
                  {status.label}
                </span>
              )}
              {subscription.founding && (
                <span className="rounded-full bg-[#1A1A2E] px-3 py-1 text-xs font-bold uppercase text-white">
                  Founding Studio · 50% off for life
                </span>
              )}
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {priceLabel && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7280]">Price</dt>
                  <dd className="font-semibold">{priceLabel}</dd>
                </div>
              )}
              {subscription.status === "trialing" && trialEnds && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7280]">Trial ends / first charge</dt>
                  <dd className="font-semibold">{trialEnds}</dd>
                </div>
              )}
              {subscription.status !== "trialing" && periodEnd && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7280]">
                    {subscription.cancel_at_period_end
                      ? "Access until"
                      : "Renews on"}
                  </dt>
                  <dd className="font-semibold">{periodEnd}</dd>
                </div>
              )}
            </dl>

            {subscription.dunning && (
              <div className="mt-6 rounded-xl border border-[#E17055]/40 bg-[#E17055]/10 p-4 text-sm text-[#8A3A24]">
                Your last payment didn&apos;t go through — usually an expired
                card. Update your card below and Stripe will retry
                automatically. Your studio stays live in the meantime.
              </div>
            )}

            {subscription.cancel_at_period_end &&
              subscription.status !== "canceled" && (
                <div className="mt-6 rounded-xl border border-[#E8DFD3] bg-[#FAF6EF] p-4 text-sm text-[#5A4E42]">
                  Your subscription is set to cancel at the end of the current
                  period. You can undo that from the billing portal below any
                  time before then.
                </div>
              )}

            <div className="mt-8">
              {billingEnabled ? (
                <form action="/api/billing/portal" method="POST">
                  <button
                    type="submit"
                    className="rounded-full bg-[#2D8B7E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#246F64]"
                  >
                    Manage billing
                  </button>
                </form>
              ) : (
                <p className="text-sm text-[#6B7280]">
                  Self-serve billing management is nearly ready. Until then,
                  email{" "}
                  <a
                    href="mailto:mikey@mewstro.com"
                    className="font-semibold text-[#2D8B7E]"
                  >
                    mikey@mewstro.com
                  </a>{" "}
                  for any card or plan change and I&apos;ll do it same-day.
                </p>
              )}
            </div>
            {billingEnabled && (
              <p className="mt-3 text-xs text-[#6B7280]">
                Card updates, invoices, plan changes and cancellation all
                happen in the secure Stripe portal — Mewstro never sees your
                card details.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
