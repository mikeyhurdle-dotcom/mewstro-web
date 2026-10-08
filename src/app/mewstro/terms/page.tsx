import type { Metadata } from "next";
import { mewstro } from "@/config/brands";
import { PrivacyPolicy } from "@/components/shared";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const sections = [
  {
    title: "Agreement",
    content:
      "These Terms of Service (\"Terms\") govern your use of Mewstro, an iOS application for tracking music practice. By downloading, installing, or using Mewstro you agree to these Terms. If you do not agree, please do not use the app.\n\nMewstro is operated by Mikey Hurdle (\"we\", \"our\", \"us\"), a sole operator based in the United Kingdom. You can reach us at support@mewstro.com.",
  },
  {
    title: "What Mewstro Is",
    content:
      "Mewstro is an iOS app that helps musicians track practice sessions, manage repertoire, plan their practice week, and build consistent practice habits.\n\nThe free tier includes the practice timer, session logging, streaks, basic calendar history (last 7 days), one instrument, and the mascot (basic moods).\n\nMewstro Premium is an optional subscription (monthly at £4.99/mo or annual at £39.99/yr) that unlocks unlimited instruments, full practice history, repertoire management, weekly planner, all widgets, the Apple Watch app, data export, extended recording retention, and the full mascot experience. Premium subscriptions include a 7-day free trial.\n\nMewstro Studio is available to students invited by a teacher via an Apple Offer Code. Studio includes all Premium features plus the community layer: studio leaderboard, teacher-set challenges, assignment inbox, and submit-to-teacher.",
  },
  {
    title: "Your Account",
    content:
      "To use Mewstro you create an account via Apple Sign-In, Google Sign-In, or email and password. You are responsible for keeping your account credentials safe. You must be at least 13 years old to create an account — younger users should ask a parent or guardian to set one up on their behalf.\n\nYou can delete your account at any time by emailing support@mewstro.com or through the in-app Account settings. We aim to permanently delete your data within 7 days of receiving a verified deletion request.",
  },
  {
    title: "In-App Purchases & Refunds",
    content:
      "Mewstro Premium subscriptions are sold through Apple's App Store using StoreKit. All payments are processed by Apple and are subject to Apple's Terms of Service.\n\nRefunds are handled directly by Apple, not by us. If you want to request a refund, use Apple's \"Report a Problem\" page at reportaproblem.apple.com within the window allowed by Apple's policies.\n\nSubscriptions auto-renew by default. You can cancel auto-renewal at any time through your iOS Settings under your Apple ID → Subscriptions. Cancellation takes effect at the end of the current billing period. We do not offer pro-rated refunds for partially-used subscription periods.\n\nIf you reinstall the app or set up a new device, use \"Restore Purchases\" on the paywall to re-enable your Premium features.",
  },
  {
    title: "Your Content",
    content:
      "Any practice data, notes, recordings, repertoire entries, or other content you create in Mewstro belongs to you. We do not claim ownership over your practice content.\n\nBy using the app, you grant us a limited licence to store, process, and display your content so we can provide the app's features — for example, syncing your sessions to Supabase, calculating your streak, rendering your heatmap, and showing your weekly minutes on a studio leaderboard you have joined.\n\nYou can export your practice sessions and repertoire as CSV files (with Mewstro Premium) at any time, and you can delete individual sessions, repertoire pieces, or recordings directly from the app.",
  },
  {
    title: "Studio Leaderboards & Teachers",
    content:
      "If you join a teacher's studio by entering an invite code, your weekly practice minutes and display name become visible on that studio's leaderboard to the teacher and to other students in the same studio. Detailed session data (notes, focus ratings, recordings) is never shared with teachers — only aggregate weekly practice time.\n\nYou can leave a studio at any time from Settings → My Studio, which immediately removes your name from that studio's leaderboard.\n\nTeachers who operate studios cannot access private fields of their students' data and cannot message students through Mewstro. The app is intentionally designed so that teachers see practice activity, not personal information.",
  },
  {
    title: "Acceptable Use",
    content:
      "You agree not to: use Mewstro for anything other than tracking and improving your own music practice; attempt to gain unauthorised access to other users' data; reverse engineer, decompile, or tamper with the app; use the app to harass, defame, or impersonate other users including teachers; submit fake practice data to gain leaderboard position or to mislead a teacher; upload recordings that contain content you do not have the right to record.\n\nWe reserve the right to suspend or terminate accounts that violate these rules.",
  },
  {
    title: "Third-Party Services",
    content:
      "Mewstro relies on the following third-party services: Apple (iOS, StoreKit, CloudKit, Sign in with Apple, HealthKit is not used); Google (Sign-In only); Supabase (authentication and database hosting, EU region); TelemetryDeck (privacy-first anonymised analytics, no personally identifiable information); Lottie by Airbnb (animation rendering). Use of each of these services is governed by their own terms and privacy policies.",
  },
  {
    title: "Disclaimers",
    content:
      "Mewstro is provided \"as is\" without warranty of any kind, either express or implied. We do not guarantee that the app will be uninterrupted, error-free, or that any bugs will be fixed. We do not guarantee that your practice data will always be available or recoverable, though we try very hard to make it so.\n\nMewstro is a practice tracking tool. It is not a replacement for a music teacher, a professional health assessment, or any form of medical advice. If you experience pain or discomfort while practising, please stop and consult an appropriate professional.",
  },
  {
    title: "Limitation of Liability",
    content:
      "To the fullest extent permitted by applicable law, Mewstro and its operator are not liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of practice data, loss of streak, loss of progress, loss of profits, or loss of goodwill, arising out of or related to your use of the app.\n\nOur total liability for any claim arising from these Terms or your use of Mewstro is limited to the amount you have paid us in the 12 months preceding the claim. For free-tier users, this will be zero.",
  },
  {
    title: "Changes to These Terms",
    content:
      "We may update these Terms from time to time. Material changes will be announced in-app or via email to the address associated with your account. Your continued use of Mewstro after a change takes effect constitutes acceptance of the updated Terms. If you do not agree to the updated Terms, you should stop using the app and delete your account.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms are governed by the laws of England and Wales. Any disputes arising under these Terms will be resolved in the courts of England and Wales, except where local law grants you a non-waivable right to bring proceedings in your country of residence.",
  },
  {
    title: "Contact",
    content:
      "Questions about these Terms? Email support@mewstro.com and we will reply as soon as we reasonably can.\n\nMewstro is operated by Mikey Hurdle, United Kingdom.",
  },
];

export default function MewstroTermsPage() {
  return (
    <div
      className="py-20 px-6"
      style={{ backgroundColor: mewstro.colors.background }}
    >
      <PrivacyPolicy brand={mewstro} sections={sections} title="Terms of Service" />
    </div>
  );
}
