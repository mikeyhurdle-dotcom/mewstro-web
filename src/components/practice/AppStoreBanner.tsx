"use client";

import { useEffect, useState } from "react";
import { mewstro } from "@/config/brands";

const DISMISS_KEY = "mewstro-appstore-banner-dismissed";

/**
 * Shown to iPhone/iPad visitors only — the portal exists for students
 * without an iPhone, so anyone on iOS is better served by the real app.
 * Never shows on Android.
 */
export function AppStoreBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      // iPadOS 13+ reports as Mac with touch support
      (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    if (isIOS && localStorage.getItem(DISMISS_KEY) !== "1") {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 bg-mewstro-text px-4 py-3 text-sm text-white">
      <p className="flex-1">
        Mewstro is best on the app —{" "}
        <a
          href={mewstro.links.appStore}
          className="font-semibold underline underline-offset-2"
        >
          get it on the App Store
        </a>
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-white/70 hover:text-white"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
