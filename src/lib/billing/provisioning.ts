/**
 * Pure mapping helpers for self-serve studio provisioning — turning what
 * Stripe Checkout gives us (a custom field, a customer name, an email)
 * into the `mewstro_studios` row we create from the webhook.
 *
 * Side-effect free so the webhook's provisioning behaviour is unit-testable
 * without Stripe or Supabase (same pattern as subscription-sync.ts).
 */

/** Matches the custom field key set in /api/billing/checkout. */
export const STUDIO_NAME_FIELD_KEY = "studio_name";

/**
 * Mirrors Stripe's checkout custom-field maximum we configure. 40 keeps
 * names readable on every surface that renders them (welcome-email studio
 * card, dashboard header, weekly digest, iOS leaderboard title).
 */
export const STUDIO_NAME_MAX_LENGTH = 40;

export const DEFAULT_STUDIO_NAME = "Your Mewstro Studio";

/** The shape we need from Stripe.Checkout.Session["custom_fields"]. */
export interface CheckoutCustomField {
  key: string;
  text?: { value?: string | null } | null;
}

/**
 * Pulls the teacher's answer to "Studio name (what your students will
 * see)" out of the checkout session. Null when the field is missing
 * (sessions created before this feature shipped) or blank.
 */
export function extractStudioNameField(
  customFields: CheckoutCustomField[] | null | undefined,
): string | null {
  const field = customFields?.find((f) => f.key === STUDIO_NAME_FIELD_KEY);
  const value = field?.text?.value?.trim();
  if (!value) return null;
  return value.slice(0, STUDIO_NAME_MAX_LENGTH);
}

function firstName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}

/**
 * Resolves the studio + teacher names for a new studio row.
 *
 * Studio name precedence: the checkout custom field, then
 * "<FirstName>'s Studio" from the Stripe customer name, then a neutral
 * default. Teacher name: the customer name, else the email local part —
 * the column is NOT NULL and Mikey fixes it up on the intro call anyway.
 */
export function resolveProvisionNames(args: {
  studioNameField: string | null;
  customerName: string | null;
  teacherEmail: string;
}): { studioName: string; teacherName: string } {
  const first = firstName(args.customerName);

  const studioName =
    args.studioNameField ??
    (first ? `${first}'s Studio` : DEFAULT_STUDIO_NAME);

  const teacherName =
    args.customerName?.trim() || args.teacherEmail.split("@")[0];

  return { studioName, teacherName };
}

/**
 * Dashboard queries scope by studio_name equality (see teacher-queries.ts),
 * so two studios sharing a name would see each other's data. There's no
 * unique constraint on the column, so provisioning must disambiguate:
 * "Piano Studio" → "Piano Studio 2" → "Piano Studio 3"…
 *
 * `isTaken` should match case-insensitively (names are compared with .eq
 * in queries, but humans typing "piano studio" vs "Piano Studio" are the
 * same collision waiting to happen).
 */
export async function uniqueStudioName(
  base: string,
  isTaken: (name: string) => Promise<boolean>,
): Promise<string> {
  if (!(await isTaken(base))) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
}
