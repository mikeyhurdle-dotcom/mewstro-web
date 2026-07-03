import type { Metadata } from "next";
import { mewstro } from "@/config/brands";
import { PrivacyPolicy } from "@/components/shared";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const sections = [
  {
    title: "Introduction",
    content:
      "Mewstro (\"we\", \"our\", \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.",
  },
  {
    title: "Information We Collect",
    content:
      "Practice session data (duration, instrument, task type) is stored locally on your device using Apple's SwiftData framework and synced via iCloud if you choose to enable it.\n\nIf you create an account, we collect your email address and display name via Apple Sign-In, Google Sign-In, or email/password registration through Supabase Auth.\n\nWe use TelemetryDeck for privacy-first analytics — it collects anonymised, aggregated usage signals (such as which screens are opened and how often sessions are logged) with no personally identifiable information, no IP address tracking, and no cross-app identifiers. You can read TelemetryDeck's privacy practices at telemetrydeck.com. We additionally use Apple's os_log for on-device debugging, which never leaves your device.\n\nWe do not sell, rent, or share any of this data with advertisers or data brokers, and Mewstro does not contain third-party advertising SDKs.",
  },
  {
    title: "How We Use Your Information",
    content:
      "Your practice data is used solely to provide the app's functionality — tracking sessions, calculating streaks, displaying progress, and powering widgets.\n\nIf you join a teacher's studio, your practice summary (not detailed session data) is shared with your teacher.\n\nWe never sell, rent, or share your personal data with third parties for marketing purposes.",
  },
  {
    title: "Embedded Video (YouTube)",
    content:
      "Teachers can share video links with their studio, and these play inside the app using YouTube's privacy-enhanced embedded player (youtube-nocookie.com). In this mode, YouTube does not store personalised tracking cookies unless you actually play the video.\n\nWhen you play an embedded video, YouTube (Google) may collect information such as your IP address and device details under its own privacy policy — see policies.google.com/privacy. We never send your Mewstro account details, practice data, or identity to YouTube, and Mewstro receives no data back from Google about what you watch.",
  },
  {
    title: "Data Storage & Security",
    content:
      "Local data is stored in SwiftData on your device. Cloud sync uses Apple's CloudKit, which encrypts data in transit and at rest.\n\nAccount data is stored in Supabase (EU region) with row-level security enabled.\n\nWe do not store any payment information — all purchases are handled by Apple through StoreKit.",
  },
  {
    title: "Your Rights",
    content:
      "You can export all your practice data as CSV files from the app at any time.\n\nYou can delete your account and all associated data by contacting us at support@mewstro.com or through the app's Settings page.\n\nIf you are located in the EU, you have additional rights under GDPR including the right to access, rectification, erasure, and data portability.",
  },
  {
    title: "Children's Privacy",
    content:
      "Mewstro is rated 4+ and is suitable for all ages. We do not knowingly collect personal information from children under 13 without parental consent. If you are a parent or guardian and believe we have collected information from your child, please contact us.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the \"Last updated\" date.",
  },
  {
    title: "Contact Us",
    content:
      "If you have any questions about this Privacy Policy, please contact us at:\n\nEmail: support@mewstro.com",
  },
];

export default function MewstroPrivacyPage() {
  return (
    <div
      className="py-20 px-6"
      style={{ backgroundColor: mewstro.colors.background }}
    >
      <PrivacyPolicy brand={mewstro} sections={sections} />
    </div>
  );
}
