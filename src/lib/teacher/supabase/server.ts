import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for teacher magic-link auth (Server
 * Components, Route Handlers, Server Actions). Anon key only — it's used
 * exclusively for Supabase Auth (signInWithOtp / verifyOtp / getUser /
 * signOut); all teacher data reads stay on the service-role client in
 * lib/supabase.ts, scoped by the entitlement check in teacher-auth.ts.
 *
 * Mirrors lib/practice/supabase/server.ts. The auth cookies are host-wide,
 * so on a shared origin a signed-in student and a signed-in teacher are the
 * same Supabase user — that's fine: each surface applies its own
 * entitlement gate (student: profile rows; teacher: mewstro_studios
 * teacher_email match).
 */
export async function createTeacherAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore, the
            // middleware refreshes sessions before we get here.
          }
        },
      },
    },
  );
}
