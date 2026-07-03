import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import {
  TRIAL_PERIOD_DAYS,
  getStripePriceId,
  isBillingEnabled,
  isBillingInterval,
  isPlanKey,
} from "@/lib/billing/plans";
import {
  STUDIO_NAME_FIELD_KEY,
  STUDIO_NAME_MAX_LENGTH,
} from "@/lib/billing/provisioning";

/**
 * Creates a Stripe Checkout Session for a teacher subscription.
 *
 * POST body:
 *   { plan: "studio" | "studio_unlimited",
 *     interval: "month" | "year",
 *     founding?: boolean,        // apply the Founding Studio 50%-forever promo
 *     email?: string,            // prefill the checkout email field
 *     studioId?: string }        // link to an existing mewstro_studios row
 *
 * All four price points map to Stripe Prices via env vars (see
 * lib/billing/plans.ts). 30-day trial, card required up front, first charge
 * on day 31. Behind NEXT_PUBLIC_BILLING_ENABLED so nothing is purchasable
 * until Mikey flips the flag after the manual Stripe setup.
 */

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: "Billing is not enabled yet." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = (body ?? {}) as Record<string, unknown>;

  const plan = raw.plan;
  const interval = raw.interval;
  if (!isPlanKey(plan) || !isBillingInterval(interval)) {
    return NextResponse.json(
      { error: "Unknown plan or billing interval." },
      { status: 400 },
    );
  }

  const priceId = getStripePriceId(plan, interval);
  if (!priceId) {
    console.error(
      `billing/checkout: no Stripe price configured for ${plan}/${interval}`,
    );
    return NextResponse.json(
      { error: "This plan isn't available for checkout yet." },
      { status: 503 },
    );
  }

  const founding = raw.founding === true;
  const email =
    typeof raw.email === "string" && /.+@.+\..+/.test(raw.email.trim())
      ? raw.email.trim().toLowerCase()
      : undefined;
  const studioId =
    typeof raw.studioId === "string" && UUID_RE.test(raw.studioId)
      ? raw.studioId
      : undefined;

  const metadata: Record<string, string> = {
    mewstro_plan: plan,
    mewstro_billing_interval: interval,
    mewstro_founding: founding ? "true" : "false",
    ...(studioId ? { mewstro_studio_id: studioId } : {}),
  };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // The one onboarding question we ask at checkout. The webhook reads
    // this to auto-provision the studio row (see billing/provisioning.ts).
    custom_fields: [
      {
        key: STUDIO_NAME_FIELD_KEY,
        label: {
          type: "custom",
          custom: "Studio name (what your students will see)",
        },
        type: "text",
        optional: false,
        text: { maximum_length: STUDIO_NAME_MAX_LENGTH, minimum_length: 2 },
      },
    ],
    // Card required at signup even though day 1–30 is free; if the teacher
    // somehow removes it before day 31, cancel rather than invoice thin air.
    payment_method_collection: "always",
    subscription_data: {
      trial_period_days: TRIAL_PERIOD_DAYS,
      trial_settings: {
        end_behavior: { missing_payment_method: "cancel" },
      },
      metadata,
    },
    metadata,
    success_url: `${siteUrl()}/mewstro/teachers/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/mewstro/pricing?checkout=cancelled`,
    ...(email ? { customer_email: email } : {}),
    ...(studioId ? { client_reference_id: studioId } : {}),
  };

  // Founding Studios get the 50%-forever promotion applied automatically so
  // they never have to type a code. Everyone else can still enter one
  // (Stripe forbids combining `discounts` with `allow_promotion_codes`).
  const foundingPromoId = process.env.STRIPE_FOUNDING_PROMO_ID?.trim();
  if (founding && foundingPromoId) {
    params.discounts = [{ promotion_code: foundingPromoId }];
  } else {
    params.allow_promotion_codes = true;
  }

  try {
    const session = await getStripe().checkout.sessions.create(params);
    if (!session.url) {
      throw new Error("Checkout session created without a URL");
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("billing/checkout: Stripe session create failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again in a minute." },
      { status: 502 },
    );
  }
}
