import { cookies } from "next/headers";
import { cache } from "react";
import { createTeacherAuthClient } from "@/lib/teacher/supabase/server";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Teacher dashboard auth — DUAL MODE during the magic-link transition
 * (see Mewstro Docs/Architecture/Teacher-Magic-Link-Auth-Design.md).
 *
 * Mode 1 — legacy shared password (Phase 1 fallback, unchanged):
 *   Each configured password maps to a single studio name; the cookie
 *   stores the resolved studio so subsequent requests know which tenant
 *   to scope queries to.
 *
 *   Configured studios:
 *     TEACHER_DASHBOARD_PASSWORD       → "EM:CAS"             (Ellie's pilot)
 *     TEACHER_DASHBOARD_PASSWORD_DEMO  → "Mewstro Studio"     (sales/marketing)
 *     TEACHER_DASHBOARD_PASSWORD_TEST  → "Mewstro (Test)"     (Mikey's testing)
 *     TEACHER_DASHBOARD_PASSWORD_JOSH  → "Josh Ingram Studio" (Founding Studio pilot)
 *
 * Mode 2 — Supabase magic link (primary):
 *   The teacher is a real Supabase Auth user; entitlement is
 *   `mewstro_studios.teacher_email` matching their verified email
 *   (case-insensitive, active studios only). A teacher may own several
 *   studios; the `mewstro_teacher_studio` selector cookie picks the
 *   active one and is re-validated against the entitlement list on
 *   every request, so it can never point at someone else's studio.
 *
 * `getActiveStudioName()` resolves from whichever mode authenticated,
 * legacy cookie first — so every existing call site works unchanged for
 * both session kinds.
 */

const COOKIE_NAME = "mewstro_teacher_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Selector cookie: which of the teacher's entitled studios is active. */
const STUDIO_SELECTOR_COOKIE = "mewstro_teacher_studio";

function getPasswordToStudioMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const ellie = process.env.TEACHER_DASHBOARD_PASSWORD;
  const demo = process.env.TEACHER_DASHBOARD_PASSWORD_DEMO;
  const test = process.env.TEACHER_DASHBOARD_PASSWORD_TEST;
  const josh = process.env.TEACHER_DASHBOARD_PASSWORD_JOSH;
  if (ellie) map[ellie] = "EM:CAS";
  if (demo) map[demo] = "Mewstro Studio";
  if (test) map[test] = "Mewstro (Test)";
  if (josh) map[josh] = "Josh Ingram Studio";
  if (Object.keys(map).length === 0) {
    throw new Error(
      "No TEACHER_DASHBOARD_PASSWORD* env vars set. Add at least one in Vercel (and .env.local for dev).",
    );
  }
  return map;
}

function getValidStudioNames(): Set<string> {
  return new Set(Object.values(getPasswordToStudioMap()));
}

export async function verifyPasswordAndLogin(
  submitted: string,
): Promise<boolean> {
  const studio = getPasswordToStudioMap()[submitted];
  if (!studio) return false;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, studio, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return true;
}

export interface EntitledStudio {
  id: string;
  studio_name: string;
}

/**
 * The studios this email is entitled to see: active `mewstro_studios`
 * rows whose teacher_email matches case-insensitively. This is the
 * magic-link trust anchor — "the cookie says so" is replaced by "the
 * authenticated teacher's email owns that studio".
 */
export async function getEntitledStudios(
  email: string,
): Promise<EntitledStudio[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("mewstro_studios")
    .select("id, studio_name")
    .ilike("teacher_email", email.trim())
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("teacher-auth: entitled studios lookup failed", error);
    return [];
  }
  return data ?? [];
}

/** Legacy password-cookie resolution — behaviour identical to pre-dual-mode. */
async function getPasswordSessionStudio(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return getValidStudioNames().has(value) ? value : null;
}

/**
 * Magic-link resolution: verified Supabase user → entitled studios →
 * active studio via the (validated) selector cookie, defaulting to the
 * teacher's first studio.
 */
async function getMagicLinkSessionStudio(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  let email: string | null = null;
  try {
    const supabase = await createTeacherAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch (err) {
    console.error("teacher-auth: Supabase session check failed", err);
    return null;
  }
  if (!email) return null;

  const studios = await getEntitledStudios(email);
  if (studios.length === 0) return null;

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(STUDIO_SELECTOR_COOKIE)?.value;
  const selected = selectedId
    ? studios.find((s) => s.id === selectedId)
    : undefined;
  return (selected ?? studios[0]).studio_name;
}

/**
 * Returns the active studio name for the current session, or null when
 * not logged in. Dual-mode: the legacy password cookie wins (validated
 * against the currently-configured password map, so a rotated env var
 * still invalidates stale cookies), then the Supabase magic-link
 * session. Memoised per request — dashboard pages call this from the
 * layout, the page, and server actions in a single render.
 */
export const getActiveStudioName = cache(
  async (): Promise<string | null> => {
    const passwordStudio = await getPasswordSessionStudio();
    if (passwordStudio) return passwordStudio;
    return getMagicLinkSessionStudio();
  },
);

export async function isTeacherLoggedIn(): Promise<boolean> {
  return (await getActiveStudioName()) !== null;
}

/**
 * Sets the active-studio selector for a magic-link teacher who owns more
 * than one studio. Must only be called from a Route Handler or Server
 * Action. The value is validated on every read, so setting it never
 * grants access — it only picks among entitled studios.
 */
export async function setActiveStudioSelector(studioId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STUDIO_SELECTOR_COOKIE, studioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/** Clears both session kinds: password cookie, selector, Supabase session. */
export async function teacherLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(STUDIO_SELECTOR_COOKIE);
  try {
    const supabase = await createTeacherAuthClient();
    await supabase.auth.signOut();
  } catch {
    // No Supabase session (or env not configured) — nothing to sign out.
  }
}
