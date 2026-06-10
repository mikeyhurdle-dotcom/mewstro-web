# Mewstro Student Portal — Design Spec

**Date:** 2026-06-10
**Status:** Approved by Mikey (2026-06-10)
**Repo:** app-landings (this repo)
**Why now:** A teacher in the Founding Studio pipeline has asked directly whether their
Android students are covered; the answer affects whether they sign up. The portal is the
short-term bridge until a native Kotlin/Compose Android app ships (separately scoped,
gated post-pilot).

## Purpose

A lightweight, mobile-first web app that lets a student **without an iPhone** join their
teacher's studio and complete the full studio loop: log practice, keep a streak, see and
complete assignments, and appear on the studio leaderboard — using the exact same Supabase
backend as the iOS app. It is deliberately a companion, not a flagship: discoverability is
kept low so iPhone users are driven to the App Store app, which has far more features.

## Non-goals (v1)

- Repertoire CRUD, planner, calendar heatmap, achievements, themes, share cards
- Offline support / sync engine (online-first; see error handling for the one exception)
- Animated mascot (static images only; no Lottie)
- Any new backend tables, RPCs, or schema changes
- Replacing the teacher dashboard's password-gate auth (students get real Supabase accounts)

## Architecture

- **Where:** new route group `src/app/practice/` in app-landings, sibling to `src/app/teacher/`.
  Same Next.js 16 + Tailwind 4 + Vercel deploy, same Supabase project (`vjbjlvbehxpfqselcomu`).
- **Auth:** Supabase Auth via `@supabase/ssr` (cookie-based sessions). Methods: email/password
  and Google OAuth. Same Supabase project as iOS, so accounts are portable across platforms.
- **Data:** supabase-js under RLS, as the signed-in user. No local database. All reads/writes
  hit the same `mewstro_*` tables and RPCs the iOS app uses:
  - `mewstro_lookup_studio(p_invite_code)` — invite-code lookup
  - `mewstro_join_studio(p_invite_code, p_display_name)` — join
  - `mewstro_get_my_assignments()` — active assignments
  - assignment completion — same call the iOS `AssignmentService` makes (confirm exact
    name from `AssignmentService.swift` during implementation)
  - `mewstro_get_studio_leaderboard(...)` — leaderboard
  - `mewstro_practice_sessions` — direct insert for logged sessions
- **Streak:** computed client-side from the user's sessions, mirroring the iOS
  `StreakCalculator` logic (port the algorithm, including its day-boundary/timezone rules).
- **PWA:** web manifest + icons so Android students can install to home screen. No service
  worker beyond what installability requires.

## Discoverability (deliberately narrow)

1. Teachers share a direct link with the invite code prefilled: `mewstro.com/practice?code=ABC123`.
2. One low-key FAQ line on the Mewstro landing page ("Have students on Android? They can use
   the student portal — share your invite link."). **No nav button.**
3. On iOS devices, the portal shows a banner: "Mewstro is best on the app — get it on the
   App Store," linking to the listing.

## Pages

| Route | Contents |
|---|---|
| `/practice` | Today screen: streak, this week's minutes, static mascot, assignments due, primary "Start practising" CTA. Redirects to sign-in/onboarding when unauthenticated. |
| `/practice/timer` | Timer (start/pause/finish), instrument picker, optional notes. Includes a "log a past session" manual-entry form. |
| `/practice/assignments` | Active assignments list; mark complete. |
| `/practice/leaderboard` | Studio leaderboard via existing RPC; same visibility/privacy behaviour as iOS (leaderboard-privacy explainer shown at join, default ON, per HOBTRAC-118). |
| `/practice/join` | Invite-code lookup → confirm studio → join. Also embedded as the final onboarding step. Reads `?code=` query param. |
| `/practice/settings` | Display name, sign out. Minimal. |

Onboarding flow: sign up → display name → invite code (prefilled from link) → lookup/join →
Today screen. A student with no studio can still use the timer/streak (matches iOS free-tier
spirit), but the join step is front and centre.

## Brand & copy

Mewstro brand guide (`Projects/Personal/Mewstro/Docs/Design/Brand-Guide.md`) for colour,
type, and voice. Copy register matches iOS: warm, always forward, never guilt. Reuse iOS
strings where they exist (e.g. "No studio found with that code. Check with your teacher and
try again."). Never describe Mewstro as a "free app" — the portal is part of the
teacher-covers-students model.

## Error handling

- Invite-code errors use the same copy as iOS (above).
- **A student must never lose a logged practice.** If a session insert fails, persist the
  pending session to localStorage, show "We'll save this when you're back online," and retry
  on next load/visibility change.
- Auth/session expiry: silent token refresh via `@supabase/ssr`; on hard failure, redirect to
  sign-in preserving the return path.

## Testing

- **Unit (Vitest):** streak calculation (port of `StreakCalculator` rules, including timezone
  and day-boundary edges), duration formatting, pending-session retry queue.
- **E2E (Playwright):** smoke flow — sign up → join studio with test invite code → log a
  session → session visible on Today + leaderboard. Run against a dedicated test user.
- **Manual:** full pass on a real Android phone (Chrome), including PWA install, before the
  teacher is told it's ready.

## Risks / notes

- supabase-swift v2.43.0 auth propagation was broken on iOS, which is why iOS hand-builds
  REST calls. supabase-js does not share this problem; use the standard client.
- Shared deploy with the marketing site: a landing-page regression can take the portal down.
  Accepted for v1; revisit if the portal outlives expectations.
- The portal writes sessions with the same shape the iOS `SyncService` pushes — verify field
  parity (duration, instrument, started_at, notes) against `SyncService.swift` during
  implementation so iOS pull-sync ingests web-logged sessions cleanly.

## Companion deliverable (separate doc)

Native Android (Kotlin + Compose) sprint plan: scoped now, gated `gate:post-pilot`, no dates.
Linear issues under the Mewstro project (personal workspace). Key decisions to capture there:
Room + supabase-kt, Play Billing, and RevenueCat vs server-side entitlements for cross-platform
solo Premium.
