import { afterEach, describe, expect, it } from "vitest";
import {
  PLANS,
  formatPriceLabel,
  getStripePriceId,
  isBillingEnabled,
  isBillingInterval,
  isPlanKey,
  TRIAL_PERIOD_DAYS,
} from "../plans";

const ENV_VARS = [
  "NEXT_PUBLIC_BILLING_ENABLED",
  "STRIPE_PRICE_STUDIO_MONTHLY",
  "STRIPE_PRICE_STUDIO_ANNUAL",
  "STRIPE_PRICE_UNLIMITED_MONTHLY",
  "STRIPE_PRICE_UNLIMITED_ANNUAL",
];

afterEach(() => {
  for (const v of ENV_VARS) delete process.env[v];
});

describe("plan catalog", () => {
  it("matches the canonical Apr-2026 pricing table", () => {
    expect(PLANS.studio.amountPence).toEqual({ month: 1499, year: 14900 });
    expect(PLANS.studio_unlimited.amountPence).toEqual({
      month: 2499,
      year: 24900,
    });
    expect(PLANS.studio.studentCap).toBe(25);
    expect(PLANS.studio_unlimited.studentCap).toBeNull();
    expect(TRIAL_PERIOD_DAYS).toBe(30);
  });

  it("validates plan keys and intervals", () => {
    expect(isPlanKey("studio")).toBe(true);
    expect(isPlanKey("studio_unlimited")).toBe(true);
    expect(isPlanKey("premium")).toBe(false);
    expect(isPlanKey(undefined)).toBe(false);
    expect(isBillingInterval("month")).toBe(true);
    expect(isBillingInterval("year")).toBe(true);
    expect(isBillingInterval("week")).toBe(false);
  });
});

describe("isBillingEnabled", () => {
  it("is off by default and only turns on with the exact string 'true'", () => {
    expect(isBillingEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_BILLING_ENABLED = "1";
    expect(isBillingEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_BILLING_ENABLED = "true";
    expect(isBillingEnabled()).toBe(true);
  });
});

describe("getStripePriceId", () => {
  it("returns null when the env var is missing or blank", () => {
    expect(getStripePriceId("studio", "month")).toBeNull();
    process.env.STRIPE_PRICE_STUDIO_MONTHLY = "  ";
    expect(getStripePriceId("studio", "month")).toBeNull();
  });

  it("resolves each plan/interval to its own env var", () => {
    process.env.STRIPE_PRICE_STUDIO_MONTHLY = "price_sm";
    process.env.STRIPE_PRICE_STUDIO_ANNUAL = "price_sa";
    process.env.STRIPE_PRICE_UNLIMITED_MONTHLY = "price_um";
    process.env.STRIPE_PRICE_UNLIMITED_ANNUAL = "price_ua";
    expect(getStripePriceId("studio", "month")).toBe("price_sm");
    expect(getStripePriceId("studio", "year")).toBe("price_sa");
    expect(getStripePriceId("studio_unlimited", "month")).toBe("price_um");
    expect(getStripePriceId("studio_unlimited", "year")).toBe("price_ua");
  });
});

describe("formatPriceLabel", () => {
  it("formats standard prices", () => {
    expect(formatPriceLabel("studio", "month")).toBe("£14.99/month");
    expect(formatPriceLabel("studio", "year")).toBe("£149/year");
    expect(formatPriceLabel("studio_unlimited", "month")).toBe("£24.99/month");
    expect(formatPriceLabel("studio_unlimited", "year")).toBe("£249/year");
  });

  it("halves for founding studios", () => {
    expect(formatPriceLabel("studio", "month", { foundingDiscount: true })).toBe(
      "£7.50/month",
    );
    expect(formatPriceLabel("studio", "year", { foundingDiscount: true })).toBe(
      "£74.50/year",
    );
  });
});
