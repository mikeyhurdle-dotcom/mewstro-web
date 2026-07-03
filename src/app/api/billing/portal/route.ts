import { NextResponse } from "next/server";
import { getActiveStudioName } from "@/lib/teacher-auth";
import { getServerSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/billing/stripe";
import { isBillingEnabled } from "@/lib/billing/plans";

/**
 * Opens the Stripe Billing Portal for the logged-in teacher — card updates,
 * invoices, plan switches and cancellation all happen there, so we never
 * touch card data. Invoked as a plain <form method="POST"> from
 * /teacher/billing, hence the 303 redirects rather than JSON.
 */

export const runtime = "nodejs";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
}

export async function POST() {
  if (!isBillingEnabled()) {
    return NextResponse.redirect(`${siteUrl()}/teacher/billing`, 303);
  }

  const studioName = await getActiveStudioName();
  if (!studioName) {
    return NextResponse.redirect(`${siteUrl()}/teacher/login`, 303);
  }

  const supabase = getServerSupabase();
  const { data: studio } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", studioName)
    .maybeSingle();
  if (!studio) {
    return NextResponse.redirect(
      `${siteUrl()}/teacher/billing?error=no-studio`,
      303,
    );
  }

  const { data: subscription } = await supabase
    .from("mewstro_studio_subscriptions")
    .select("stripe_customer_id")
    .eq("studio_id", studio.id)
    .maybeSingle();
  if (!subscription?.stripe_customer_id) {
    return NextResponse.redirect(
      `${siteUrl()}/teacher/billing?error=no-subscription`,
      303,
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl()}/teacher/billing`,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("billing/portal: session create failed", err);
    return NextResponse.redirect(
      `${siteUrl()}/teacher/billing?error=portal-failed`,
      303,
    );
  }
}
