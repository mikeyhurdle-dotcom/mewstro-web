import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  isStudioActive,
  mapStripeStatus,
  subscriptionRowFromStripe,
} from "../subscription-sync";

/** Minimal fake of a Stripe subscription with only the fields we read. */
function fakeSubscription(
  overrides: Partial<{
    id: string;
    customer: string;
    status: Stripe.Subscription.Status;
    metadata: Record<string, string>;
    trial_end: number | null;
    cancel_at_period_end: boolean;
    itemPeriodEnd: number | null;
    itemInterval: "month" | "year" | null;
  }> = {},
): Stripe.Subscription {
  const {
    id = "sub_123",
    customer = "cus_123",
    status = "trialing",
    metadata = {},
    trial_end = null,
    cancel_at_period_end = false,
    itemPeriodEnd = null,
    itemInterval = "month",
  } = overrides;

  return {
    id,
    customer,
    status,
    metadata,
    trial_end,
    cancel_at_period_end,
    items: {
      data: [
        {
          current_period_end: itemPeriodEnd,
          price: itemInterval
            ? { recurring: { interval: itemInterval } }
            : { recurring: null },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

describe("mapStripeStatus", () => {
  it("passes through the statuses we store", () => {
    for (const s of [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "paused",
      "incomplete",
    ] as const) {
      expect(mapStripeStatus(s)).toBe(s);
    }
  });

  it("folds incomplete_expired into canceled", () => {
    expect(mapStripeStatus("incomplete_expired")).toBe("canceled");
  });
});

describe("isStudioActive", () => {
  it("keeps trialing, active and past_due studios live", () => {
    expect(isStudioActive("trialing")).toBe(true);
    expect(isStudioActive("active")).toBe(true);
    expect(isStudioActive("past_due")).toBe(true);
  });

  it("deactivates canceled, unpaid, paused and incomplete studios", () => {
    expect(isStudioActive("canceled")).toBe(false);
    expect(isStudioActive("unpaid")).toBe(false);
    expect(isStudioActive("paused")).toBe(false);
    expect(isStudioActive("incomplete")).toBe(false);
  });
});

describe("subscriptionRowFromStripe", () => {
  it("extracts plan/interval/founding from checkout metadata", () => {
    const row = subscriptionRowFromStripe(
      fakeSubscription({
        metadata: {
          mewstro_plan: "studio_unlimited",
          mewstro_billing_interval: "year",
          mewstro_founding: "true",
        },
        status: "trialing",
        trial_end: 1_790_000_000,
        itemPeriodEnd: 1_790_000_000,
      }),
    );
    expect(row.plan).toBe("studio_unlimited");
    expect(row.billing_interval).toBe("year");
    expect(row.founding).toBe(true);
    expect(row.status).toBe("trialing");
    expect(row.trial_ends_at).toBe(
      new Date(1_790_000_000 * 1000).toISOString(),
    );
    expect(row.current_period_end).toBe(
      new Date(1_790_000_000 * 1000).toISOString(),
    );
  });

  it("falls back to the price's recurring interval when metadata is absent", () => {
    const row = subscriptionRowFromStripe(
      fakeSubscription({ metadata: {}, itemInterval: "year" }),
    );
    expect(row.plan).toBeNull();
    expect(row.billing_interval).toBe("year");
    expect(row.founding).toBe(false);
  });

  it("handles expanded customer objects and missing trial", () => {
    const sub = fakeSubscription({ status: "active" });
    (sub as unknown as { customer: { id: string } }).customer = {
      id: "cus_expanded",
    };
    const row = subscriptionRowFromStripe(sub);
    expect(row.stripe_customer_id).toBe("cus_expanded");
    expect(row.trial_ends_at).toBeNull();
    expect(row.cancel_at_period_end).toBe(false);
  });
});
