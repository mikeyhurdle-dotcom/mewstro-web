import type { Metadata, Viewport } from "next";
import { AppStoreBanner } from "@/components/practice/AppStoreBanner";

export const metadata: Metadata = {
  title: {
    default: "Mewstro",
    template: "%s · Mewstro",
  },
  description:
    "Log your practice, keep your streak going, and stay connected to your teacher's studio.",
  // Deliberately low-profile: the portal is the Android bridge, not a
  // destination we promote. iPhone users belong in the App Store app.
  robots: { index: false, follow: false },
  manifest: "/practice/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#F4845F",
  width: "device-width",
  initialScale: 1,
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-mewstro-bg text-mewstro-text">
      <AppStoreBanner />
      {children}
    </div>
  );
}
