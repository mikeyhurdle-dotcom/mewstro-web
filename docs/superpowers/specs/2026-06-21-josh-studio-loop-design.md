# The Studio Teaching Loop — Design Spec

**Date:** 2026-06-21
**Source:** Feedback from founding teacher Josh Ingram (Thursday 2026-06-18 session) + 16 Jun check-in.
**Goal frame:** Founding-studio-ready — build the loop properly for Josh *and* the next founding teachers, not a one-off Josh patch.
**Linear:** [HOBTRAC-218](https://linear.app/playsmashd-ltd/issue/HOBTRAC-218) (bug), [HOBTRAC-219](https://linear.app/playsmashd-ltd/issue/HOBTRAC-219) (dashboard + assets), [HOBTRAC-211](https://linear.app/playsmashd-ltd/issue/HOBTRAC-211) (combined instruments). Out of scope, parked: [HOBTRAC-220](https://linear.app/playsmashd-ltd/issue/HOBTRAC-220) (milestone cap), [HOBTRAC-101](https://linear.app/playsmashd-ltd/issue/HOBTRAC-101) (subsumed by §1).

## Repos
- **Web teacher dashboard:** `mewstro-web/` (Next.js, `studio.mewstro.com`). Assignment + resource create/read, student dashboard.
- **iOS app:** `Mewstro/` (SwiftUI). Student-facing delivery (assignment card, resource card), instrument pairing.
- **DB:** Supabase project `nspgvdytqsvnmbitbmey` (org "Meteora Mikey", currently Free plan).

## Why these are one workstream (not three tickets)
Josh's three asks overlap on a shared spine:
1. The bug fix (218) and "per-student assignments" (219) touch the **same create path** — fixing it twice is wasteful.
2. Per-student assignments and student-specific resources (219) both **live on the student dashboard**.
3. The student **delivery pattern** (RPC → iOS card) will be cloned for resources — so the assignment card's bug must be fixed *first* or resources inherit it.
4. Resource instrument-tagging depends on the **instrument model** (211).

Therefore: design the create/delivery contract once (§1), then hang the new surfaces off it (§2, §3). Sequence **spine-first**.

---

## §1 — Assignment create path (the spine) · fixes HOBTRAC-218

### Root cause (confirmed against live DB, 2026-06-21)
Two genuinely-persisted, byte-identical assignment rows in Josh's studio targeting student "Celine", created **2.94s apart** (18:46:49.026 / 18:46:51.968). Two distinct faults:

- **Fault 1 — persisted duplication (teacher's "2").** `createAssignment` (`mewstro-web/src/lib/teacher-queries.ts:639`) inserts exactly one assignment + one target per student per call — correct for a single call. But the flow is **non-idempotent**: the submit button (`mewstro-web/src/app/teacher/assignments/new/page.tsx:184`) has no pending/disabled state, and `mewstro_assignments` has **only `PRIMARY KEY (id)`** — no dedup. A double-click / action retry creates two rows. (`mewstro_assignment_targets` has a composite PK, which is why there were no within-assignment target dupes.)
- **Fault 2 — student-side render (student's "3" + overlap).** The studio holds only 2 rows and the RPC `mewstro_get_my_assignments` is clean (filters completed, no row-multiplying join) — so "3" cannot come from data. iOS `AssignmentService.refresh()` (`Mewstro/Services/AssignmentService.swift:24`) can run **concurrently** (triggered by `.task(id:)`, `.onChange(scenePhase)`, and parent `refreshTrigger`) with a non-atomic check-then-insert → a duplicate SwiftData row, possibly same `id`. A `ForEach` over duplicate `Identifiable` ids (`Mewstro/Views/Practice/AssignmentsCard.swift:48`) collides in SwiftUI's diffing → **overlapping cards**.

### Fix (defense in depth)
1. **Web idempotency:** mint a hidden `idempotency_key` (UUID) when the form renders; carry into `createAssignmentAction`; disable submit while pending via `useFormStatus`.
2. **DB guard:** add `idempotency_key uuid` + `UNIQUE` to `mewstro_assignments`; `createAssignment` inserts `on conflict (idempotency_key) do nothing` → retry is a no-op. (Migration in `mewstro-web` supabase migrations + applied to `nspgvdytqsvnmbitbmey`.)
3. **Targeting contract:** keep `createAssignment(studentUserIds[])` as the single path serving global / subset / single-student (§2 just preselects one). No fork.
4. **iOS render fix:** serialise `refresh()` with an in-flight guard; dedupe the `@Query` result by `id` before the `ForEach`.
5. **Data cleanup:** delete the orphan duplicate row `5ed9231d-7df5-45da-93c4-eec974a65e7f` from Josh's studio (`bce8078c-…`). Celine completed both, so user impact is cosmetic, but the teacher view should read 1.
6. **Stale copy:** remove the "students don't see assignments inside the app yet — on the roadmap" block on `mewstro-web/src/app/teacher/assignments/page.tsx:133` (shipped in 1.0.2; Josh is reading it).

### Tests
- Double-submit (same idempotency key) creates exactly **one** assignment + intended targets.
- iOS: concurrent refresh never yields duplicate rows; multi-assignment layout never overlaps.

---

## §1b — Student assignment history (Profile) · added 2026-06-21

**Gap:** once a student taps "complete", the assignment vanishes everywhere — `mewstro_get_my_assignments` filters out completed ones and `markComplete` deletes the local SwiftData row (`Mewstro/Services/AssignmentService.swift:112`). Students keep **no record** of what they've done. Active assignments also only live on the Practice homepage card.

**Add:** an **Assignments** section in the student's profile area (the **Settings tab**, `Mewstro/Views/Settings/SettingsTabView.swift`) showing **all** assignments — active and completed — grouped Active / Completed, with completion dates and any completion notes.

**Implementation:**
- DB: new RPC `mewstro_get_my_assignment_history()` returning every assignment targeting the caller plus completion state (`completed_at`, `notes`) — mirrors the web `getAssignmentsForStudent` (`mewstro-web/src/lib/teacher-queries.ts:568`).
- iOS: one read-only list view that fetches fresh from the RPC on open — **independent of the homepage card's cache**, so `markComplete`'s delete behaviour is untouched.
- Homepage card stays the "active, do-it-now" surface; the profile list is the history.

**Deliberately out of scope:** filters, search, pagination. A simple grouped list is enough for the pilot.

---

## §2 — Student dashboard write actions · HOBTRAC-219 (slice)

The dashboard already exists as a rich **read-only** view (`mewstro-web/src/app/teacher/students/[studentId]/page.tsx`): stats, 90-day heatmap, assignments, repertoire, recent sessions, milestone videos.

**Add:** a **"Set an assignment for this student"** action that opens the §1 create path with this student pre-targeted. Optionally an "Add resource for this student" entry once §3 lands.

**Deferred (E — discovery, not in this sprint):** teacher *editing* of repertoire. Student owns repertoire in-app; ownership/conflict handling is unresolved (219 discovery questions). Keep repertoire read-only on the dashboard for now.

---

## §3 — Studio Resources · HOBTRAC-219 (core)

**Scope decision:** embedded **links + embedded video (YouTube/Vimeo) + PDF/document upload**. **No direct video upload** — teachers host video on their own YouTube/Vimeo, which keeps egress cost off us permanently and avoids the per-file/IP/Pro-plan problems (see cost analysis below). Hosted documents are cheap (megabytes, rarely re-fetched).

### Data model — `mewstro_studio_resources`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `studio_id` | uuid fk | |
| `created_by` | uuid | teacher (see known debt re: placeholder teacher id) |
| `type` | enum | `link` \| `embed_video` \| `document` |
| `title` | text | |
| `description` | text null | |
| `url` | text null | for `link` / `embed_video` |
| `storage_path` | text null | for `document` (Supabase Storage) |
| `instrument_tags` | text[] | values from the `Instrument` enum incl. `voice`; empty = all |
| `audience` | enum | `studio` \| `instrument` \| `student` |
| `audience_instrument` | text null | when `audience = instrument` |
| `audience_student_user_id` | uuid null | when `audience = student` |
| `created_at` / `updated_at` | timestamptz | |

### Teacher CRUD (web)
- Library under **Profile › My Studio ("Studio Materials")**, alongside Studio Milestones.
- Per-student add from the dashboard (§2) — pre-sets `audience = student`.
- Document upload includes an **IP attestation checkbox** ("you have the right to share this"). Delete = takedown. No moderation pipeline in v1.

### Student delivery
- RPC `mewstro_get_my_resources()` mirroring `mewstro_get_my_assignments`: returns resources where caller is a studio member AND (`audience = studio` OR (`audience = instrument` AND instrument ∈ caller's instruments) OR (`audience = student` AND `audience_student_user_id = auth.uid()`)).
- iOS **ResourcesCard** cloning the **now-fixed** `AssignmentsCard` pattern (serialised refresh, id-deduped `ForEach`).
- `embed_video` / `link` → open externally (SFSafariViewController). `document` → lazy signed-URL fetch on tap (mirror milestone signed-URL pattern). No autoplay/auto-download in lists.

---

## §4 — Combined instrument pairing · HOBTRAC-211 (iOS, independent)

**Intent (confirmed):** "Guitar + Vocals" / "Piano + Vocals" as a **first-class pairing** — one session/piece that is both playing and singing, not two separate instruments. (The app already supports a multi-instrument `[String]` profile and has `voice` in the enum, but that models *two separate* instruments, not a combined performance.)

**Approach:** add an **optional secondary instrument** to `PracticeSession` and `Repertoire` (`primaryInstrument` + optional `secondaryInstrument`) rather than exploding the `Instrument` enum with combo cases. Picker gains "+ add voice / second instrument". A combined session counts toward **both** instruments' analytics.

Independent of the web work — slots in any time. **Gets its own short implementation plan** because of the analytics/aggregation implications (per-instrument minute totals, heatmap, repertoire-by-instrument).

---

## §5 — Sequence & gates

**Build order:** **§1 (now — unblocks Josh)** → **§1b (rides with §1)** → **§2** → **§3** → **§4 (anytime)** → **E (discovery)**.

§1b is a small read-only iOS addition that completes the assignment feature; it reuses §1's delivery pattern and the existing web history query, so it ships alongside §1.

- §1 is the immediate, well-scoped, high-priority fix (Josh hit it live).
- §2 is cheap once §1's create path is hardened.
- §3 is the meaty new subsystem; depends on §1's fixed delivery pattern.
- §4 is iOS-only and parallelizable.
- The Ellie/Josh pilot gate is unaffected — nothing here opens public surfaces.

## Cost analysis (informs §3 + HOBTRAC-220)
- Org is on Supabase **Free** (1 GB storage / 5 GB egress per month / 50 MB max file). Current usage ~0.65 MB.
- Egress (views), not storage, is the video cost driver; Supabase serves whole files per view (no adaptive streaming). **Direct video upload is a non-starter on Free and a scaling risk even on Pro** → §3 uses YouTube/Vimeo embeds instead (£0, proper streaming, IP liability stays with the teacher).
- Documents (PDF) are trivially cheap. Embeds/links are free.
- Milestone recordings (existing) are safe: 60s/480p cap, lazy-loaded, thumbnailed, opt-in sharing. Raising that cap is its own decision — see [HOBTRAC-220](https://linear.app/playsmashd-ltd/issue/HOBTRAC-220).

## Known debt (note, do not fix this pass)
- `createAssignment` writes a **placeholder `teacher_user_id` `00000000-0000-0000-0000-000000000001`** because there is no real teacher-auth identity yet. Fine for the pilot; "founding-studio-ready" with multiple teachers will eventually need real teacher identity on assignments + resources. The same applies to `mewstro_studio_resources.created_by`.

## Acceptance (this sprint = §1 + §1b + §2 + §3)
- One submission → exactly one assignment; counts agree across teacher/student; student cards never overlap; regression coverage on idempotency + layout.
- Student can view all their assignments (active + completed, with completion dates/notes) in the Settings/Profile tab; homepage card still shows only active.
- Teacher can set an assignment for an individual student from their dashboard.
- Teacher can add studio/instrument/student-scoped resources (links, embedded video, PDFs); students see the right ones on iOS; documents lazy-load; embeds open externally; IP attestation captured.
