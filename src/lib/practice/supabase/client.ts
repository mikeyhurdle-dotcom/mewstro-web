import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for the student portal.
 *
 * Anon key + RLS only — students are real Supabase Auth users, so every
 * read/write is scoped by the same row-level-security policies the iOS
 * app relies on. The teacher dashboard's service-role client
 * (`src/lib/supabase.ts`) must never be imported under /practice.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
