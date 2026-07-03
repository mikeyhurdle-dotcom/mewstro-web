/**
 * Canonical teacher plan catalog for Stripe billing.
 *
 * The four price points (Docs/GTM/Pricing-Table-Apr2026.md in the Mewstro
 * repo is the source of truth):
 *
 *   Studio            £14.99/mo  or £149/yr   (up to 25 students)
 *   Studio Unlimited  £24.99/mo  or £249/yr   (unlimited students)
 *
 * All prices GBP. 30-day free trial, card required at signup, first charge
 * on day 31. Founding Studios (first 5) get 50% off for life via a Stripe
 * promotion code with a forever-duration coupon.
 *
 * Stripe Price IDs are injected via env vars so test mode and live mode can
 * use the same code. Amounts here are display-only — Stripe's Price objects
 * are what actually get charged.
 */

export type PlanKey = "studio" | "studio_unlimited";
export type BillingInterval = "month" | "year";

export interface PlanDefinition {
  key: PlanKey;
  label: string;
  studentCap: number | null; // null = unlimited
  /** Display amounts in pence, keyed by interval. */
  amountPence: Record<BillingInterval, number>;
  /** Env var names holding the Stripe Price IDs, keyed by interval. */
  priceIdEnvVar: Record<BillingInterval, string>;
}

export const TRIAL_PERIOD_DAYS = 30;

export const PLANS: Record<PlanKey, PlanDefinition> = {
  studio: {
    key: "studio",
    label: "Studio",
    studentCap: 25,
    amountPence: { month: 1499, year: 14900 },
    priceIdEnvVar: {
      month: "STRIPE_PRICE_STUDIO_MONTHLY",
      year: "STRIPE_PRICE_STUDIO_ANNUAL",
    },
  },
  studio_unlimited: {
    key: "studio_unlimited",
    label: "Studio Unlimited",
    studentCap: null,
    amountPence: { month: 2499, year: 24900 },
    priceIdEnvVar: {
      month: "STRIPE_PRICE_UNLIMITED_MONTHLY",
      year: "STRIPE_PRICE_UNLIMITED_ANNUAL",
    },
  },
};

export function isPlanKey(value: unknown): value is PlanKey {
  return value === "studio" || value === "studio_unlimited";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

/**
 * Global kill-switch. Checkout stays dark until this is "true" in Vercel,
 * so shipping this code changes nothing user-visible by itself.
 */
export function isBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
}

/**
 * Resolves the Stripe Price ID for a plan + interval from env. Returns null
 * (rather than throwing) when unset so callers can 503 gracefully — price
 * IDs won't exist until Mikey creates the Products in Stripe.
 */
export function getStripePriceId(
  plan: PlanKey,
  interval: BillingInterval,
): string | null {
  const envVar = PLANS[plan].priceIdEnvVar[interval];
  return process.env[envVar]?.trim() || null;
}

/** "£14.99/month", "£249/year" — for emails and the billing page. */
export function formatPriceLabel(
  plan: PlanKey,
  interval: BillingInterval,
  opts: { foundingDiscount?: boolean } = {},
): string {
  let pence = PLANS[plan].amountPence[interval];
  if (opts.foundingDiscount) pence = Math.round(pence / 2);
  const pounds = pence / 100;
  const amount = Number.isInteger(pounds)
    ? `£${pounds}`
    : `£${pounds.toFixed(2)}`;
  return `${amount}/${interval}`;
}
