import type Stripe from "stripe";
import { isBillingInterval, isPlanKey } from "./plans";
import type { BillingInterval, PlanKey } from "./plans";

/**
 * Pure mapping helpers between Stripe subscription objects and the
 * `mewstro_studio_subscriptions` table. Kept side-effect free so the
 * webhook logic is unit-testable without a Stripe or Supabase connection.
 *
 * Status model (mirrors Stripe's, minus `incomplete_expired` which we fold
 * into `canceled`):
 *   trialing  → in the 30-day trial, card on file
 *   active    → paying
 *   past_due  → a renewal charge failed; Stripe is retrying (dunning)
 *   unpaid    → Stripe gave up retrying
 *   canceled  → ended (by the teacher, by dunning settings, or by us)
 *   paused    → trial ended without a payment method (shouldn't happen —
 *               we require a card at checkout — but handled defensively)
 *   incomplete → first payment attempt still pending
 */

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  if (status === "incomplete_expired") return "canceled";
  return status;
}

/**
 * Whether the studio should be treated as live (`mewstro_studios.is_active`).
 * `past_due` stays active on purpose: Stripe is still retrying the card and
 * yanking a teacher's whole studio over one failed charge is not the Mewstro
 * way. `unpaid`/`canceled`/`paused` do deactivate.
 */
export function isStudioActive(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active" || status === "past_due";
}

/** Values we upsert into mewstro_studio_subscriptions from a webhook. */
export interface SubscriptionRowPatch {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan: PlanKey | null;
  billing_interval: BillingInterval | null;
  status: SubscriptionStatus;
  founding: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

function toIso(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number"
    ? new Date(unixSeconds * 1000).toISOString()
    : null;
}

/**
 * Extracts the row patch from a Stripe subscription. Plan + interval come
 * from the subscription metadata we set at checkout (falling back to the
 * price's recurring interval), and `current_period_end` from the first
 * subscription item — Stripe moved it off the subscription object in
 * API version 2025-03-31.basil and later.
 */
export function subscriptionRowFromStripe(
  sub: Stripe.Subscription,
): SubscriptionRowPatch {
  const item = sub.items?.data?.[0];

  const metaPlan = sub.metadata?.mewstro_plan;
  const plan: PlanKey | null = isPlanKey(metaPlan) ? metaPlan : null;

  const metaInterval = sub.metadata?.mewstro_billing_interval;
  const itemInterval = item?.price?.recurring?.interval;
  const billing_interval: BillingInterval | null = isBillingInterval(
    metaInterval,
  )
    ? metaInterval
    : isBillingInterval(itemInterval)
      ? itemInterval
      : null;

  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    plan,
    billing_interval,
    status: mapStripeStatus(sub.status),
    founding: sub.metadata?.mewstro_founding === "true",
    trial_ends_at: toIso(sub.trial_end),
    current_period_end: toIso(item?.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end === true,
  };
}
