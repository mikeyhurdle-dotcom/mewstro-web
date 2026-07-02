import Stripe from "stripe";

/**
 * Server-side Stripe client. Lazy so pages that merely import billing
 * helpers don't explode when STRIPE_SECRET_KEY isn't configured yet
 * (billing ships dark behind NEXT_PUBLIC_BILLING_ENABLED).
 *
 * Required env vars on Vercel (and in .env.local for dev):
 *   - STRIPE_SECRET_KEY       sk_test_... / sk_live_...
 *   - STRIPE_WEBHOOK_SECRET   whsec_... (webhook route only)
 *
 * We deliberately omit `apiVersion` so the SDK uses the version it ships
 * pinned to (currently 2026-06-24.dahlia) — keeping types and runtime in
 * lockstep. Upgrade the API version by upgrading the `stripe` package.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it in Vercel (and .env.local for dev) before enabling billing.",
    );
  }
  cached = new Stripe(key);
  return cached;
}
