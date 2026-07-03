import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase session (if any) on /teacher requests so
 * magic-link teacher sessions don't silently expire after the 1-hour
 * access token. Unlike the student portal's updatePracticeSession this
 * NEVER redirects — the /teacher gate stays in the layout/pages, because
 * the legacy password cookie must keep authenticating teachers who have
 * no Supabase session at all (dual-mode transition).
 *
 * `buildResponse` lets the caller decide what the final response is
 * (plain next() or the studio.mewstro.com hostname rewrite) while this
 * helper only takes care of carrying refreshed auth cookies onto it.
 */
export async function refreshTeacherSession(
  request: NextRequest,
  buildResponse: (req: NextRequest) => NextResponse,
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return buildResponse(request);

  // Cheap skip: no Supabase auth cookie means nothing to refresh (pure
  // password-cookie sessions take this path on every request).
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuthCookie) return buildResponse(request);

  let response = buildResponse(request);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = buildResponse(request);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT against Supabase Auth and triggers the
  // cookie refresh when the access token has expired.
  await supabase.auth.getUser();

  return response;
}
