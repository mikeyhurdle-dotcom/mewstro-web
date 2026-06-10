import { NextResponse } from "next/server";

/**
 * Web manifest scoped to /practice so Android students can install the
 * portal to their home screen. Deliberately no service worker — the
 * portal is online-first; installability no longer requires one and a
 * cache could serve stale authed pages.
 */
export function GET() {
  return NextResponse.json(
    {
      name: "Mewstro",
      short_name: "Mewstro",
      description:
        "Log your practice, keep your streak going, and stay connected to your teacher's studio.",
      id: "/practice",
      start_url: "/practice",
      scope: "/practice",
      display: "standalone",
      background_color: "#FFFBF7",
      theme_color: "#F4845F",
      icons: [
        {
          src: "/mewstro/portal-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/mewstro/portal-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/mewstro/portal-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
