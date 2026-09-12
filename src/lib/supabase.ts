import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for the teacher dashboard.
 *
 * Uses the service role key to bypass RLS. Every teacher caller must first
 * establish a verified Supabase identity and an active studio entitlement
 * via `teacher-auth.ts`, then scope each query to that studio. We never
 * expose this client to the browser.
 *
 * Required env vars on Vercel (and in .env.local for dev):
 *   - NEXT_PUBLIC_SUPABASE_URL         e.g. https://nspgvdytqsvnmbitbmey.supabase.co
 *   - SUPABASE_SERVICE_ROLE_KEY        the long service_role secret
 */
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel (or .env.local for dev).",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
