"use client";

import { useState } from "react";

/**
 * Pricing-page CTA that starts a Stripe Checkout session for a teacher
 * tier. Rendered only when NEXT_PUBLIC_BILLING_ENABLED is "true" (the
 * server component decides); while the flag is off the pricing page keeps
 * its "Apply for Founding Studio access" links unchanged.
 */

type PlanKey = "studio" | "studio_unlimited";
type BillingInterval = "month" | "year";

export function CheckoutButtons({
  plan,
  monthlyLabel,
  annualLabel,
  highlighted,
}: {
  plan: PlanKey;
  monthlyLabel: string; // e.g. "£14.99/month"
  annualLabel: string; // e.g. "£149/year"
  highlighted?: boolean;
}) {
  const [pending, setPending] = useState<BillingInterval | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(interval: BillingInterval) {
    if (pending) return;
    setPending(interval);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout unavailable");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Checkout unavailable"
          ? err.message
          : "Couldn't start checkout just now. Please try again, or email mikey@mewstro.com and I'll sort it.",
      );
      setPending(null);
    }
  }

  const primaryClasses = highlighted
    ? "bg-white text-[#2D8B7E]"
    : "bg-[#2D8B7E] text-white";
  const secondaryClasses = highlighted
    ? "border border-white/60 text-white"
    : "border border-[#2D8B7E] text-[#2D8B7E]";

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => startCheckout("month")}
        disabled={pending !== null}
        className={`block w-full rounded-xl px-5 py-4 text-center text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 ${primaryClasses}`}
      >
        {pending === "month"
          ? "Opening checkout…"
          : `Start 30-day free trial · ${monthlyLabel}`}
      </button>
      <button
        type="button"
        onClick={() => startCheckout("year")}
        disabled={pending !== null}
        className={`mt-3 block w-full rounded-xl px-5 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 ${secondaryClasses}`}
      >
        {pending === "year"
          ? "Opening checkout…"
          : `Or pay annually · ${annualLabel}`}
      </button>
      {error && (
        <p
          role="alert"
          className={`mt-3 text-xs text-center ${highlighted ? "text-white" : "text-[#B3261E]"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
