import { NextRequest, NextResponse } from "next/server";
import { updatePracticeSession } from "@/lib/practice/supabase/middleware";

const DOMAIN_MAP: Record<string, string> = {
  "mewstro.com": "/mewstro",
  "www.mewstro.com": "/mewstro",
  "spindlapp.com": "/spindl",
  "www.spindlapp.com": "/spindl",
};

const TEACHER_HOST = "studio.mewstro.com";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const path = request.nextUrl.pathname;

  // Canonical-hostname enforcement: 301 the www variant to the apex.
  // Both hostnames have valid certs, but a single canonical URL avoids
  // duplicate-content noise and keeps cookies / sessions on one host.
  if (hostname === `www.${TEACHER_HOST}`) {
    const target = `https://${TEACHER_HOST}${path}${request.nextUrl.search}`;
    return NextResponse.redirect(target, 301);
  }

  if (hostname === TEACHER_HOST) {
    if (path.startsWith("/teacher")) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = path === "/" ? "/teacher" : `/teacher${path}`;
    return NextResponse.rewrite(url);
  }

  // Student portal: lives at /practice on every host (so teachers can
  // share mewstro.com/practice?code=...). Refreshes the Supabase session
  // and gates unauthenticated access — see lib/practice/supabase/middleware.
  if (path.startsWith("/practice")) {
    return updatePracticeSession(request);
  }

  const prefix = DOMAIN_MAP[hostname];
  if (!prefix) return NextResponse.next();

  if (path.startsWith(prefix)) return NextResponse.next();
  if (path.startsWith("/teacher")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `${prefix}${path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|mewstro/|spindl/).*)"],
};
