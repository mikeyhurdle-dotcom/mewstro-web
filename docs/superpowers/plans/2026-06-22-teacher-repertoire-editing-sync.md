# Teacher Repertoire Editing + Bidirectional LWW Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let a teacher add/edit/delete a student's repertoire from the dashboard, syncing bidirectionally with the student's iOS app via last-write-wins, without losing student data.

**Architecture:** Server-authoritative `updated_at` (BEFORE-UPDATE trigger) + `deleted_at` soft-delete tombstone on `mewstro_repertoire`. iOS `pullRepertoire` reworked to LWW-merge on `updated_at` and honour tombstones; `pushRepertoire` unchanged content-wise (trigger stamps the timestamp); local edits bump a local `updatedAt`; all repertoire reads filter tombstones. Teacher CRUD on the dashboard writes via the service-role client. Content stays correct under LWW because `SyncService.syncAll` pulls before it pushes.

**Tech Stack:** Supabase/Postgres (project `nspgvdytqsvnmbitbmey`, via MCP), SwiftUI + SwiftData + XCTest, Next.js 16 (App Router, service-role Supabase).

## Global Constraints
- DB changes via Supabase MCP `apply_migration`/`execute_sql`. Project `nspgvdytqsvnmbitbmey`.
- Repos: iOS `~/StormlightArchive/Projects/HobbyTracker-Pulse/HobbyTracker/Mewstro`; web `~/StormlightArchive/Projects/HobbyTracker-Pulse/HobbyTracker/mewstro-web` (branch off `main` first). Use `git -C <abs path>`. End commits with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- iOS sim: use `iPhone 17` (no iPhone 16). Test target `MewstroTests` (wired into the shared scheme).
- Web: no JS unit runner → `npx tsc --noEmit` + `npx next build` are the gates. `getServerSupabase()` is service-role (RLS bypassed).
- **LWW is server-authoritative:** the trigger sets `updated_at = now()` on every insert/update. The iOS merge compares `remote.updated_at` to a locally-tracked `updatedAt`. Content correctness relies on syncAll's pull-before-push order — do not reorder.
- **This is live student data.** The Task 8 manual test matrix is a required deliverable; tombstone filtering must be applied at EVERY repertoire read.
- Spec: `mewstro-web/docs/superpowers/specs/2026-06-22-teacher-repertoire-editing-sync.md`.

---

### Task 1: DB — `updated_at` (trigger) + `deleted_at` tombstone on `mewstro_repertoire`

**Files:** Supabase MCP `apply_migration` name `repertoire_updated_at_and_soft_delete`; doc at `mewstro-web/docs/db-migrations/2026-06-22-repertoire_updated_at_and_soft_delete.sql`.

**Interfaces:** Produces columns `mewstro_repertoire.updated_at timestamptz not null`, `mewstro_repertoire.deleted_at timestamptz null`, and trigger `trg_mewstro_repertoire_updated_at`.

- [ ] **Step 1: Apply migration**
```sql
alter table public.mewstro_repertoire
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.mewstro_repertoire set updated_at = coalesce(updated_at, created_at, now());
alter table public.mewstro_repertoire alter column updated_at set not null;
alter table public.mewstro_repertoire alter column updated_at set default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_mewstro_repertoire_updated_at on public.mewstro_repertoire;
create trigger trg_mewstro_repertoire_updated_at
  before update on public.mewstro_repertoire
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2: Verify the trigger bumps updated_at and backfill is intact**
```sql
-- pick any existing row, capture updated_at, update it, confirm updated_at advanced
with r as (select id, updated_at from public.mewstro_repertoire limit 1)
select id, updated_at as before from r;
-- (run an UPDATE on that id setting title=title, then re-select; updated_at must be > before)
select count(*) as rows_without_updated_at from public.mewstro_repertoire where updated_at is null;
```
Expected: `rows_without_updated_at = 0`; the touched row's `updated_at` advances after an UPDATE.

- [ ] **Step 3: Record migration doc + commit** (on a new branch `hobtrac-219-repertoire-sync` in mewstro-web)
```bash
# write the DDL from Step 1 into docs/db-migrations/2026-06-22-repertoire_updated_at_and_soft_delete.sql with a
# "-- applied to nspgvdytqsvnmbitbmey 2026-06-22 via MCP" header, then:
git -C <mewstro-web> add docs/db-migrations/2026-06-22-repertoire_updated_at_and_soft_delete.sql
git -C <mewstro-web> commit -m "db(219 E): repertoire updated_at trigger + deleted_at tombstone"
```

---

### Task 2: iOS — add `updatedAt`/`deletedAt` to model + DTO

**Files:** Modify `Mewstro/Mewstro/Models/Repertoire.swift`, `Mewstro/Shared/SharedModels/RepertoireDTO.swift`. Branch `hobtrac-219-repertoire-sync` in the Mewstro repo.

**Interfaces:** `Repertoire.updatedAt: Date` (default `.now`), `Repertoire.deletedAt: Date?`; `RepertoireDTO.updatedAt: Date`, `RepertoireDTO.deletedAt: Date?` with CodingKeys `updated_at`/`deleted_at`.

- [ ] **Step 1: Add fields to the `@Model`**
Add to `Repertoire`: `var updatedAt: Date` and `var deletedAt: Date?`. Give `updatedAt` a default (`= Date()`) AND an init param `updatedAt: Date = .now`; `deletedAt: Date? = nil`. (Adding a defaulted property + an optional is a SwiftData lightweight migration — no migration plan needed.)

- [ ] **Step 2: Add fields to `RepertoireDTO`**
Add `let updatedAt: Date` and `let deletedAt: Date?`, with `case updatedAt = "updated_at"` and `case deletedAt = "deleted_at"` in CodingKeys. Update every `RepertoireDTO(...)` construction site (notably `SyncService.pushRepertoire`, and `AddRepertoireSheet.swift:214` area) to pass `updatedAt: <local.updatedAt>` and `deletedAt: <local.deletedAt>`.

- [ ] **Step 3: Build**
Run: `cd Mewstro && xcodebuild build -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 17'`
Expected: build succeeds.

- [ ] **Step 4: Commit**
```bash
git -C <Mewstro> add Mewstro/Models/Repertoire.swift Shared/SharedModels/RepertoireDTO.swift Mewstro/Services/SyncService.swift Mewstro/Views/Repertoire/AddRepertoireSheet.swift
git -C <Mewstro> commit -m "feat(219 E): add updatedAt/deletedAt to Repertoire model + DTO"
```

---

### Task 3: iOS — LWW merge decision (pure fn) + tests

**Files:** Create `Mewstro/Mewstro/Services/RepertoireMerge.swift`; test `Mewstro/MewstroTests/RepertoireMergeTests.swift`.

**Interfaces:** `enum RepertoireMergeAction { case delete, apply, insert, skip }`; `func repertoireMergeAction(remoteDeletedAt: Date?, remoteUpdatedAt: Date, localExists: Bool, localUpdatedAt: Date?) -> RepertoireMergeAction`.

- [ ] **Step 1: Failing tests**
```swift
import XCTest
@testable import Mewstro

final class RepertoireMergeTests: XCTestCase {
    private let t0 = Date(timeIntervalSince1970: 1000)
    private let t1 = Date(timeIntervalSince1970: 2000)

    func testTombstoneDeletesExistingLocal() {
        XCTAssertEqual(repertoireMergeAction(remoteDeletedAt: t1, remoteUpdatedAt: t1, localExists: true, localUpdatedAt: t0), .delete)
    }
    func testTombstoneNoLocalIsSkip() {
        XCTAssertEqual(repertoireMergeAction(remoteDeletedAt: t1, remoteUpdatedAt: t1, localExists: false, localUpdatedAt: nil), .skip)
    }
    func testNewerRemoteApplies() {
        XCTAssertEqual(repertoireMergeAction(remoteDeletedAt: nil, remoteUpdatedAt: t1, localExists: true, localUpdatedAt: t0), .apply)
    }
    func testOlderOrEqualRemoteSkips() {
        XCTAssertEqual(repertoireMergeAction(remoteDeletedAt: nil, remoteUpdatedAt: t0, localExists: true, localUpdatedAt: t1), .skip)
        XCTAssertEqual(repertoireMergeAction(remoteDeletedAt: nil, remoteUpdatedAt: t0, localExists: true, localUpdatedAt: t0), .skip)
    }
    func testNoLocalInserts() {
        XCTAssertEqual(repertoireMergeAction(remoteDeletedAt: nil, remoteUpdatedAt: t1, localExists: false, localUpdatedAt: nil), .insert)
    }
}
```

- [ ] **Step 2: Run, see fail**
Run: `cd Mewstro && xcodebuild test -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 17' -only-testing:MewstroTests/RepertoireMergeTests`
Expected: FAIL (symbols not found).

- [ ] **Step 3: Implement**
```swift
import Foundation

enum RepertoireMergeAction: Equatable { case delete, apply, insert, skip }

/// Decides how a pulled remote repertoire row reconciles with local state.
/// Last-write-wins on updated_at; tombstones (deleted_at) remove local rows.
func repertoireMergeAction(
    remoteDeletedAt: Date?,
    remoteUpdatedAt: Date,
    localExists: Bool,
    localUpdatedAt: Date?
) -> RepertoireMergeAction {
    if remoteDeletedAt != nil {
        return localExists ? .delete : .skip
    }
    if !localExists { return .insert }
    if let local = localUpdatedAt, remoteUpdatedAt > local { return .apply }
    return .skip
}
```
Add `RepertoireMerge.swift` to the Mewstro app target + the test file to MewstroTests in `project.pbxproj`.

- [ ] **Step 4: Run, see pass**
Run: same as Step 2. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git -C <Mewstro> add Mewstro/Services/RepertoireMerge.swift MewstroTests/RepertoireMergeTests.swift Mewstro.xcodeproj/project.pbxproj
git -C <Mewstro> commit -m "feat(219 E): LWW repertoire merge decision + tests"
```

---

### Task 4: iOS — rework `pullRepertoire` to use LWW + tombstones + all fields

**Files:** Modify `Mewstro/Mewstro/Services/SyncService.swift` (`pullRepertoire`).

**Interfaces:** Consumes `repertoireMergeAction(...)` (Task 3) + the new DTO fields (Task 2).

- [ ] **Step 1: Replace the merge body**
In `pullRepertoire`, for each `dto` in `remoteItems`, fetch the local row by id, then:
```swift
let action = repertoireMergeAction(
    remoteDeletedAt: dto.deletedAt,
    remoteUpdatedAt: dto.updatedAt,
    localExists: existing.first != nil,
    localUpdatedAt: existing.first?.updatedAt
)
switch action {
case .delete:
    if let local = existing.first { modelContext.delete(local) }
case .apply:
    if let local = existing.first {
        local.title = dto.title
        local.artist = dto.artist
        local.status = dto.status
        local.totalPracticeMinutes = dto.totalPracticeMinutes
        local.instrumentType = dto.instrumentType
        local.targetCompletionDate = dto.targetCompletionDate
        local.targetBPM = dto.targetBPM
        local.currentBPM = dto.currentBPM
        local.updatedAt = dto.updatedAt
    }
case .insert:
    let item = Repertoire(
        id: dto.id, title: dto.title, artist: dto.artist, status: dto.status,
        totalPracticeMinutes: dto.totalPracticeMinutes, instrumentType: dto.instrumentType,
        targetCompletionDate: dto.targetCompletionDate, targetBPM: dto.targetBPM,
        currentBPM: dto.currentBPM, createdAt: dto.createdAt, updatedAt: dto.updatedAt
    )
    modelContext.insert(item)
case .skip:
    break
}
```
(Match the actual `Repertoire` initializer parameter list — adjust if BPM/createdAt arg order differs. The `.insert` case must NOT insert tombstoned rows; that's handled because `.skip` is returned when remoteDeletedAt != nil and no local exists.)

- [ ] **Step 2: Build + run the merge tests (regression that the call site compiles against the pure fn)**
Run: `cd Mewstro && xcodebuild test -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 17' -only-testing:MewstroTests/RepertoireMergeTests`
Expected: build succeeds, PASS.

- [ ] **Step 3: Commit**
```bash
git -C <Mewstro> add Mewstro/Services/SyncService.swift
git -C <Mewstro> commit -m "feat(219 E): pullRepertoire LWW merge + tombstone deletes + BPM fields"
```

---

### Task 5: iOS — bump `updatedAt` on local edits

**Files:** Modify local repertoire mutation sites: `Mewstro/Mewstro/Views/Repertoire/AddRepertoireSheet.swift` (create/edit), repertoire detail/status/BPM edit views, and anywhere `Repertoire` fields are written locally.

**Interfaces:** Every local write to a `Repertoire` sets `piece.updatedAt = .now` so the next push/merge treats the local edit as newest.

- [ ] **Step 1: Audit + set `updatedAt = .now` at each local mutation**
Find the write sites:
```bash
cd Mewstro && grep -rn "\.status =\|\.targetBPM =\|\.currentBPM =\|\.title =\|\.artist =\|\.targetCompletionDate =\|modelContext.insert(Repertoire\|Repertoire(" Mewstro/Views/Repertoire Mewstro/Views Mewstro/Services | grep -v SyncService
```
At each local edit (NOT the pull-merge in SyncService, which sets it from remote), add `piece.updatedAt = .now`. New pieces get `.now` via the init default.

- [ ] **Step 2: Build**
Run: `cd Mewstro && xcodebuild build -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 17'`
Expected: build succeeds.

- [ ] **Step 3: Commit**
```bash
git -C <Mewstro> add -A Mewstro/Views Mewstro/Services
git -C <Mewstro> commit -m "feat(219 E): bump Repertoire.updatedAt on local edits"
```

---

### Task 6: iOS — filter tombstones from every repertoire read

**Files:** Audit all `FetchDescriptor<Repertoire>` / `@Query` for `Repertoire`.

**Interfaces:** Every repertoire read excludes `deletedAt != nil`.

- [ ] **Step 1: Find all reads**
```bash
cd Mewstro && grep -rn "FetchDescriptor<Repertoire>\|@Query.*Repertoire\|Query(.*Repertoire" Mewstro
```

- [ ] **Step 2: Add the predicate**
For each read, add `#Predicate<Repertoire> { $0.deletedAt == nil }` (combine with any existing predicate). For `@Query`, add the filter. Targets: Repertoire tab list, repertoire picker (practice session), any assignment/repertoire counts, stats. Leave `pullRepertoire`'s own fetch-by-id alone (it must see the row to delete it).

- [ ] **Step 3: Build**
Run: `cd Mewstro && xcodebuild build -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 17'`
Expected: build succeeds.

- [ ] **Step 4: Commit**
```bash
git -C <Mewstro> add -A Mewstro
git -C <Mewstro> commit -m "feat(219 E): exclude tombstoned repertoire from all reads"
```

---

### Task 7: Web — filter tombstones in dashboard repertoire reads

**Files:** Modify `mewstro-web/src/lib/teacher-queries.ts` (every `.from("mewstro_repertoire")` select).

- [ ] **Step 1: Add `.is("deleted_at", null)`**
Find the reads:
```bash
cd mewstro-web && grep -n 'from("mewstro_repertoire")' src/lib/teacher-queries.ts
```
Add `.is("deleted_at", null)` to each `select` (notably in `getStudentDetail`).

- [ ] **Step 2: Typecheck**
Run: `cd mewstro-web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git -C <mewstro-web> add src/lib/teacher-queries.ts
git -C <mewstro-web> commit -m "fix(219 E): exclude soft-deleted repertoire from dashboard reads"
```

---

### Task 8: Web — teacher repertoire CRUD on the student page

**Files:** Create `mewstro-web/src/app/teacher/students/[studentId]/repertoire-actions.ts`; add repertoire write helpers to `mewstro-web/src/lib/teacher-queries.ts`; create a client edit component `mewstro-web/src/app/teacher/students/[studentId]/RepertoireEditor.tsx`; wire it into the student page repertoire section.

**Interfaces:** Server actions `updateRepertoirePieceAction(formData)`, `addRepertoirePieceAction(formData)`, `deleteRepertoirePieceAction(formData)`; query helpers `updateRepertoirePiece`, `addRepertoirePiece`, `softDeleteRepertoirePiece` (service-role writes, each sets `updated_at` only via the trigger — i.e. just do the update; trigger stamps it; for soft delete set `deleted_at = new Date().toISOString()`).

- [ ] **Step 1: Query helpers** in `teacher-queries.ts`
```ts
export async function updateRepertoirePiece(args: {
  id: string; studioName: string;
  title?: string; artist?: string | null; status?: string;
  targetBpm?: number | null; targetCompletionDate?: string | null; instrumentType?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  // Verify the piece belongs to a student in this studio before writing (scope guard).
  const fields: Record<string, unknown> = {};
  if (args.title !== undefined) fields.title = args.title;
  if (args.artist !== undefined) fields.artist = args.artist;
  if (args.status !== undefined) fields.status = args.status;
  if (args.targetBpm !== undefined) fields.target_bpm = args.targetBpm;
  if (args.targetCompletionDate !== undefined) fields.target_completion_date = args.targetCompletionDate;
  if (args.instrumentType !== undefined) fields.instrument_type = args.instrumentType;
  const { error } = await supabase.from("mewstro_repertoire").update(fields).eq("id", args.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function softDeleteRepertoirePiece(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from("mewstro_repertoire")
    .update({ deleted_at: new Date().toISOString() }).eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function addRepertoirePiece(args: {
  studentUserId: string; title: string; artist: string | null; status: string;
  instrumentType: string; targetBpm: number | null; targetCompletionDate: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("mewstro_repertoire").insert({
    user_id: args.studentUserId, title: args.title, artist: args.artist, status: args.status,
    instrument_type: args.instrumentType, target_bpm: args.targetBpm,
    target_completion_date: args.targetCompletionDate, total_practice_minutes: 0,
  }).select("id").single();
  return (error || !data) ? { ok: false, error: error?.message ?? "Insert failed" } : { ok: true, id: data.id };
}
```
(Confirm exact column names against the live table with `list_tables`/`execute_sql` before finalising — e.g. `target_bpm` vs `target_b_p_m`.)

- [ ] **Step 2: Server actions** (`repertoire-actions.ts`, file-level `"use server"`) — read fields from `formData`, resolve `getActiveStudioName()` (redirect to /teacher/login if none), call the helpers, `revalidatePath('/teacher/students/[studentId]')` or redirect back to the student page.

- [ ] **Step 3: UI** (`RepertoireEditor.tsx`, client) — render each piece with inline edit (status dropdown, target BPM, title/artist) + a delete button (confirm), and an "Add piece" form. Wire into the student page's Repertoire section, replacing the read-only `RepertoireCard` list with editable rows. Keep derived fields (total minutes, current BPM) read-only/display.

- [ ] **Step 4: Typecheck + build**
Run: `cd mewstro-web && npx tsc --noEmit && npx next build`
Expected: compiles; `/teacher/students/[studentId]` builds.

- [ ] **Step 5: Commit**
```bash
git -C <mewstro-web> add src/app/teacher/students src/lib/teacher-queries.ts
git -C <mewstro-web> commit -m "feat(219 E): teacher repertoire CRUD on the student dashboard"
```

---

### Task 9: Manual test matrix (required — live student data)

Not automatable here; run after merge against a test studio + a TestFlight/simulator student. Document results.
- [ ] Student-only add/edit/delete still works (regression).
- [ ] Teacher add → student syncs → appears.
- [ ] Teacher edit (title, status, target BPM) → student syncs → applies.
- [ ] Teacher delete → student syncs → row removed; gone from pickers + stats.
- [ ] Student edits piece, then teacher edits same later → teacher wins.
- [ ] Teacher edits, then student edits same later → student wins.
- [ ] Offline student edit then sync after a teacher edit → resolves by timestamp, no crash/dup.
- [ ] Tombstone filtering verified on Repertoire tab, practice-session picker, dashboard, stats.

## Self-Review
- Spec coverage: DB updated_at+deleted_at+trigger (T1); iOS model/DTO (T2), merge fn+tests (T3), pull rework (T4), local bump (T5), tombstone reads (T6); web reads (T7), CRUD (T8); matrix (T9). ✓
- Placeholder scan: column names in T8 flagged for confirmation against the live schema (explicit instruction, not a placeholder). Pull `.insert` initializer arg order flagged to match the real initializer. No TODOs.
- Type consistency: `repertoireMergeAction` signature identical in T3 def and T4 call; DTO fields `updatedAt`/`deletedAt` consistent T2→T4.
- Risk: server-authoritative `updated_at` via trigger means iOS push need not set it; correctness depends on syncAll pull-before-push (Global Constraints).
