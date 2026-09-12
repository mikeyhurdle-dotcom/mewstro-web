import { cookies } from "next/headers";
import { cache } from "react";
import { createTeacherAuthClient } from "@/lib/teacher/supabase/server";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Teacher dashboard authentication and authorization.
 *
 * Supabase Auth proves identity. An active `mewstro_studios` row whose
 * `teacher_email` exactly matches the verified user's email grants studio
 * access. The selector cookie only chooses among those server-derived
 * entitlements; it is never itself treated as proof of access.
 */

const LEGACY_COOKIE_NAME = "mewstro_teacher_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Selector cookie: which of the teacher's entitled studios is active. */
export const STUDIO_SELECTOR_COOKIE = "mewstro_teacher_studio";

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
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("mewstro_studios")
    .select("id, studio_name, teacher_email")
    .ilike("teacher_email", email.trim())
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("teacher-auth: entitled studios lookup failed", error);
    return [];
  }

  // Recheck as values after the case-insensitive query. `%`, `_` and `*` are
  // valid email characters but wildcard operators in PostgREST; the exact
  // comparison prevents a crafted identity from gaining a pattern match.
  return (data ?? [])
    .filter(
      (studio) =>
        studio.teacher_email?.trim().toLowerCase() === normalizedEmail,
    )
    .map(({ id, studio_name }) => ({ id, studio_name }));
}

/**
 * Resolve the current server-verified Supabase identity. `getUser()` checks
 * with Supabase Auth rather than trusting the user object stored in cookies.
 */
async function getVerifiedTeacherEmail(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createTeacherAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      if (error.name !== "AuthSessionMissingError") {
        console.warn("teacher-auth: Supabase session rejected", error);
      }
      return null;
    }
    const email = user?.email?.trim();
    return email || null;
  } catch (err) {
    console.error("teacher-auth: Supabase session check failed", err);
    return null;
  }
}

/**
 * Verified identity → entitled studios → validated selector, with a stable
 * first-studio fallback. Exported uncached so the authorization boundary can
 * be regression-tested directly; application callers use the cached wrapper.
 */
export async function resolveActiveStudioName(): Promise<string | null> {
  const email = await getVerifiedTeacherEmail();
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
 * Returns the entitled active studio for the verified Supabase user, or null.
 * Memoised per request because layouts, pages and actions may ask repeatedly.
 */
export const getActiveStudioName = cache(resolveActiveStudioName);

export async function isTeacherLoggedIn(): Promise<boolean> {
  return (await getActiveStudioName()) !== null;
}

/**
 * Sets the selector only when the current verified identity is entitled to
 * the requested studio. Reads validate it again, so a forged/stale selector
 * can never grant cross-studio access.
 */
export async function setActiveStudioSelector(
  studioId: string,
): Promise<boolean> {
  const email = await getVerifiedTeacherEmail();
  if (!email) return false;

  const studios = await getEntitledStudios(email);
  if (!studios.some((studio) => studio.id === studioId)) return false;

  const cookieStore = await cookies();
  cookieStore.set(STUDIO_SELECTOR_COOKIE, studioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return true;
}

/** Clears Supabase auth, the selector, and any inert pre-fix legacy cookie. */
export async function teacherLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LEGACY_COOKIE_NAME);
  cookieStore.delete(STUDIO_SELECTOR_COOKIE);
  try {
    const supabase = await createTeacherAuthClient();
    await supabase.auth.signOut();
  } catch {
    // No Supabase session (or env not configured) — nothing to sign out.
  }
}
