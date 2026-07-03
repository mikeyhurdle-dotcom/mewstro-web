import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ServerClient } from "postmark";
import { getStripe } from "@/lib/billing/stripe";
import { getServerSupabase } from "@/lib/supabase";
import {
  isStudioActive,
  subscriptionRowFromStripe,
  type SubscriptionRowPatch,
} from "@/lib/billing/subscription-sync";
import {
  PLANS,
  formatPriceLabel,
  isBillingInterval,
  isPlanKey,
} from "@/lib/billing/plans";
import {
  extractStudioNameField,
  resolveProvisionNames,
  uniqueStudioName,
} from "@/lib/billing/provisioning";
import { generateInviteCode } from "@/lib/billing/invite-code";

/**
 * Stripe webhook — the single source of truth for subscription state.
 *
 * Handled events:
 *   checkout.session.completed        → create/activate the studio subscription row
 *   customer.subscription.updated     → status sync (incl. mewstro_studios.is_active)
 *   customer.subscription.deleted     → mark canceled + deactivate the studio
 *   invoice.payment_failed            → set the dunning flag + alert Mikey
 *   invoice.paid                      → clear the dunning flag
 *
 * Idempotency: every event id is recorded in mewstro_stripe_webhook_events
 * (unique on event_id); a redelivered event is acknowledged without
 * reprocessing. Signature is verified with STRIPE_WEBHOOK_SECRET, so the
 * route is safe to expose publicly.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Supabase = ReturnType<typeof getServerSupabase>;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      secret,
    );
  } catch (err) {
    console.error("billing/webhook: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServerSupabase();

  // ─── Idempotency guard ──────────────────────────────────────────────────
  const { error: dedupeErr } = await supabase
    .from("mewstro_stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });
  if (dedupeErr) {
    if (dedupeErr.code === "23505") {
      // Unique violation — Stripe redelivered an event we already handled.
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("billing/webhook: event log insert failed", dedupeErr);
    // Fail closed so Stripe retries — better a retry than a lost event.
    return NextResponse.json({ error: "Event log failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(supabase, event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object);
        break;
      case "invoice.paid":
        await setDunning(supabase, invoiceSubscriptionId(event.data.object), false);
        break;
      default:
        // Not subscribed to anything else, but acknowledge just in case.
        break;
    }
  } catch (err) {
    console.error(`billing/webhook: ${event.type} handler failed`, err);
    // Remove the dedupe row so Stripe's retry actually reprocesses.
    await supabase
      .from("mewstro_stripe_webhook_events")
      .delete()
      .eq("event_id", event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── checkout.session.completed ────────────────────────────────────────────

async function handleCheckoutCompleted(
  supabase: Supabase,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) {
    throw new Error(`Checkout session ${session.id} has no subscription`);
  }

  // Fetch the full subscription so trial dates/period end come from Stripe
  // rather than us re-deriving them.
  const subscription =
    await getStripe().subscriptions.retrieve(subscriptionId);
  const patch = subscriptionRowFromStripe(subscription);

  const teacherEmail =
    session.customer_details?.email?.toLowerCase() ??
    session.customer_email?.toLowerCase() ??
    null;

  // Resolve the studio: explicit reference from the dashboard flow first,
  // then fall back to matching the teacher's email on mewstro_studios.
  // (Josh/Ellie path — a pre-existing studio keeps its exact old behaviour.)
  let studioId =
    session.client_reference_id ?? session.metadata?.mewstro_studio_id ?? null;
  let studioInfo: { studio_name: string; invite_code: string } | null = null;
  if (studioId) {
    const { data: studio } = await supabase
      .from("mewstro_studios")
      .select("studio_name, invite_code")
      .eq("id", studioId)
      .maybeSingle();
    studioInfo = studio ?? null;
  } else if (teacherEmail) {
    const { data: studio } = await supabase
      .from("mewstro_studios")
      .select("id, studio_name, invite_code")
      .ilike("teacher_email", teacherEmail)
      .maybeSingle();
    studioId = studio?.id ?? null;
    studioInfo = studio
      ? { studio_name: studio.studio_name, invite_code: studio.invite_code }
      : null;
  }

  // Self-serve path: no existing studio matched, so auto-provision one from
  // the checkout details. Never let a provisioning hiccup fail the webhook —
  // fall back to the old "save unlinked + tell Mikey" behaviour instead.
  let provisioned = false;
  if (!studioId && teacherEmail) {
    try {
      const created = await provisionStudio(supabase, session, teacherEmail);
      studioId = created.id;
      studioInfo = {
        studio_name: created.studio_name,
        invite_code: created.invite_code,
      };
      provisioned = true;
    } catch (err) {
      console.error("billing/webhook: studio auto-provision failed", err);
    }
  }

  await upsertSubscriptionRow(supabase, patch, {
    studioId,
    teacherEmail,
  });

  if (teacherEmail) {
    sendTeacherWelcome({
      to: teacherEmail,
      name: session.customer_details?.name ?? null,
      patch,
      studio: studioInfo,
    });
  }

  if (studioId) {
    await syncStudioActive(supabase, studioId, patch.status);
  }

  if (provisioned && studioInfo) {
    // Informational, not action-blocking: the studio is live and the teacher
    // already has everything they need. Mikey's touch is the intro call.
    notifyMikey(
      "New Mewstro studio auto-provisioned",
      [
        `A teacher just self-served through Stripe checkout and their studio`,
        `was created automatically. Nothing is blocked — they have their`,
        `invite code and dashboard sign-in already.`,
        ``,
        `Teacher:      ${session.customer_details?.name ?? "unknown"} <${teacherEmail}>`,
        `Studio:       ${studioInfo.studio_name}`,
        `Invite code:  ${studioInfo.invite_code}`,
        `Plan:         ${patch.plan ?? "unknown"} (${patch.billing_interval ?? "?"})`,
        `Founding:     ${patch.founding ? "yes" : "no"}`,
        `Subscription: ${patch.stripe_subscription_id}`,
        ``,
        `Your two follow-ups (when you get a minute):`,
        `  1. Book their intro call — they've been told to reply to the`,
        `     welcome email to arrange it.`,
        `  2. Create their Apple offer code for the iOS app.`,
      ].join("\n"),
    );
  } else if (!studioId) {
    // No studio row and provisioning wasn't possible (no email) or failed.
    // Row is saved unlinked; flag it for manual linking as before.
    notifyMikey(
      "Stripe checkout needs a studio link",
      [
        `A teacher just completed Stripe checkout but no mewstro_studios row matched.`,
        ``,
        `Email:        ${teacherEmail ?? "unknown"}`,
        `Plan:         ${patch.plan ?? "unknown"} (${patch.billing_interval ?? "?"})`,
        `Founding:     ${patch.founding ? "yes" : "no"}`,
        `Subscription: ${patch.stripe_subscription_id}`,
        `Customer:     ${patch.stripe_customer_id}`,
        ``,
        `Create their studio, then set studio_id on the`,
        `mewstro_studio_subscriptions row for that subscription.`,
      ].join("\n"),
    );
  }
}

/**
 * Creates the mewstro_studios row for a self-serve checkout. Studio name
 * comes from the checkout custom field (fallbacks in provisioning.ts),
 * disambiguated because dashboard queries scope by name; the invite code
 * is derived from the name and collision-checked against existing codes.
 * Retries once on an invite-code unique violation (webhook race).
 */
async function provisionStudio(
  supabase: Supabase,
  session: Stripe.Checkout.Session,
  teacherEmail: string,
): Promise<{ id: string; studio_name: string; invite_code: string }> {
  const { studioName, teacherName } = resolveProvisionNames({
    studioNameField: extractStudioNameField(session.custom_fields),
    customerName: session.customer_details?.name ?? null,
    teacherEmail,
  });

  const finalName = await uniqueStudioName(studioName, async (name) => {
    const { data, error } = await supabase
      .from("mewstro_studios")
      .select("id")
      .ilike("studio_name", name)
      .limit(1);
    if (error) throw new Error(`studio name check failed: ${error.message}`);
    return (data?.length ?? 0) > 0;
  });

  const codeTaken = async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("mewstro_studios")
      .select("id")
      .eq("invite_code", code)
      .limit(1);
    if (error) throw new Error(`invite code check failed: ${error.message}`);
    return (data?.length ?? 0) > 0;
  };

  for (let attempt = 0; ; attempt++) {
    const inviteCode = await generateInviteCode(finalName, codeTaken);
    const { data, error } = await supabase
      .from("mewstro_studios")
      .insert({
        studio_name: finalName,
        teacher_name: teacherName,
        teacher_email: teacherEmail,
        invite_code: inviteCode,
        is_active: true,
      })
      .select("id, studio_name, invite_code")
      .single();
    if (!error && data) return data;
    if (error?.code === "23505" && attempt === 0) continue; // code race — regenerate
    throw new Error(`studio insert failed: ${error?.message ?? "no row"}`);
  }
}

// ─── customer.subscription.updated / .deleted ──────────────────────────────

async function handleSubscriptionChange(
  supabase: Supabase,
  subscription: Stripe.Subscription,
): Promise<void> {
  const patch = subscriptionRowFromStripe(subscription);

  const { data: row, error } = await supabase
    .from("mewstro_studio_subscriptions")
    .update({
      status: patch.status,
      trial_ends_at: patch.trial_ends_at,
      current_period_end: patch.current_period_end,
      cancel_at_period_end: patch.cancel_at_period_end,
      founding: patch.founding,
      ...(patch.plan ? { plan: patch.plan } : {}),
      ...(patch.billing_interval
        ? { billing_interval: patch.billing_interval }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", patch.stripe_subscription_id)
    .select("studio_id")
    .maybeSingle();
  if (error) throw new Error(`subscription update failed: ${error.message}`);

  if (!row) {
    // Subscription event arrived before checkout.session.completed (Stripe
    // doesn't order events). Upsert so nothing is lost; the checkout handler
    // will fill in the studio link when it lands.
    await upsertSubscriptionRow(supabase, patch, {
      studioId: subscription.metadata?.mewstro_studio_id ?? null,
      teacherEmail: null,
    });
    return;
  }

  if (row.studio_id) {
    await syncStudioActive(supabase, row.studio_id, patch.status);
  }
}

// ─── invoice.payment_failed / invoice.paid ─────────────────────────────────

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

async function handleInvoicePaymentFailed(
  supabase: Supabase,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return; // one-off invoice, not ours
  await setDunning(supabase, subscriptionId, true);

  notifyMikey(
    "Mewstro payment failed (dunning)",
    [
      `A subscription renewal charge failed.`,
      ``,
      `Customer email: ${invoice.customer_email ?? "unknown"}`,
      `Subscription:   ${subscriptionId}`,
      `Amount due:     £${((invoice.amount_due ?? 0) / 100).toFixed(2)}`,
      ``,
      `Stripe will retry per the dunning settings. The subscription row is`,
      `flagged dunning=true until an invoice.paid event clears it.`,
    ].join("\n"),
  );
}

async function setDunning(
  supabase: Supabase,
  subscriptionId: string | null,
  dunning: boolean,
): Promise<void> {
  if (!subscriptionId) return;
  const { error } = await supabase
    .from("mewstro_studio_subscriptions")
    .update({
      dunning,
      ...(dunning ? { last_payment_failed_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) throw new Error(`dunning update failed: ${error.message}`);
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function upsertSubscriptionRow(
  supabase: Supabase,
  patch: SubscriptionRowPatch,
  extra: { studioId: string | null; teacherEmail: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("mewstro_studio_subscriptions")
    .upsert(
      {
        stripe_subscription_id: patch.stripe_subscription_id,
        stripe_customer_id: patch.stripe_customer_id,
        plan: patch.plan,
        billing_interval: patch.billing_interval,
        status: patch.status,
        founding: patch.founding,
        trial_ends_at: patch.trial_ends_at,
        current_period_end: patch.current_period_end,
        cancel_at_period_end: patch.cancel_at_period_end,
        studio_id: extra.studioId,
        teacher_email: extra.teacherEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
  if (error) throw new Error(`subscription upsert failed: ${error.message}`);
}

async function syncStudioActive(
  supabase: Supabase,
  studioId: string,
  status: SubscriptionRowPatch["status"],
): Promise<void> {
  const { error } = await supabase
    .from("mewstro_studios")
    .update({ is_active: isStudioActive(status) })
    .eq("id", studioId);
  if (error) throw new Error(`studio is_active sync failed: ${error.message}`);
}

// Fire-and-forget day-0 welcome email via the Postmark template
// `teacher-welcome-trial`. The promises in the copy (reminder before first
// charge, one-click cancel) must stay in step with /pricing and the day-23
// mewstro-trial-reminder edge function. When a studio is linked (matched or
// auto-provisioned) the email also carries the studio name, the student
// invite code, and the magic-link dashboard sign-in explanation — the
// template renders that block only when studio_name is present, so the
// rare unlinked checkout still gets a valid welcome.
function sendTeacherWelcome(args: {
  to: string;
  name: string | null;
  patch: SubscriptionRowPatch;
  studio: { studio_name: string; invite_code: string } | null;
}): void {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) return;

  const plan = isPlanKey(args.patch.plan) ? args.patch.plan : "studio";
  const interval = isBillingInterval(args.patch.billing_interval)
    ? args.patch.billing_interval
    : "month";
  const founding = args.patch.founding === true;
  const priceLabel = formatPriceLabel(plan, interval, {
    foundingDiscount: founding,
  }).replace("/", " per ");

  const trialEnd = args.patch.trial_ends_at
    ? new Date(args.patch.trial_ends_at)
    : null;
  const firstChargeDate = trialEnd
    ? trialEnd.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "the end of your 30-day trial";

  const postmark = new ServerClient(token);
  void postmark
    .sendEmailWithTemplate({
      From: "Mikey from Mewstro <mikey@mewstro.com>",
      To: args.to,
      TemplateAlias: "teacher-welcome-trial",
      TemplateModel: {
        teacher_name: args.name?.trim().split(/\s+/)[0] || "there",
        plan_label: PLANS[plan].label,
        price_label: priceLabel,
        first_charge_date: firstChargeDate,
        founding: founding || undefined,
        billing_url: "https://mewstro.com/teacher/billing",
        ...(args.studio
          ? {
              studio_name: args.studio.studio_name,
              invite_code: args.studio.invite_code,
              dashboard_url: "https://studio.mewstro.com",
            }
          : {}),
      },
      MessageStream: "outbound",
      TrackOpens: true,
    })
    .catch((err) => {
      // Welcome email must never break webhook processing.
      console.error("billing/webhook: welcome email failed", err);
    });
}

// Fire-and-forget ops email — never blocks or fails the webhook response.
function notifyMikey(subject: string, text: string): void {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const notifyEmail = process.env.NOTIFY_EMAIL ?? "mikey@mewstro.com";
  if (!token) return;
  const postmark = new ServerClient(token);
  void postmark
    .sendEmail({
      From: "Mewstro <mikey@mewstro.com>",
      To: notifyEmail,
      Subject: subject,
      TextBody: text,
      MessageStream: "outbound",
    })
    .catch(() => {
      // Ops notifications must never break webhook processing.
    });
}
