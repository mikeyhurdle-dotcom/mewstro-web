import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/** /practice routes reachable without a session. */
const PUBLIC_PATHS = [
  "/practice/sign-in",
  "/practice/sign-up",
  "/practice/auth/",
];

/**
 * Refresh the student's Supabase session on every /practice request and
 * bounce unauthenticated visitors to sign-in, preserving the full return
 * path (pathname + query — the `?code=` invite param must survive the
 * round-trip so onboarding can prefill it).
 */
export async function updatePracticeSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT against Supabase Auth — don't swap for
  // getSession(), which trusts the cookie unverified.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/practice/sign-in";
    url.search = "";
    url.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    const redirect = NextResponse.redirect(url);
    // Carry over any refreshed auth cookies so the session state stays
    // consistent through the redirect.
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return response;
}
