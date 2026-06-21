# Assignment Spine + Student History — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make assignment creation idempotent (kill the duplicate-assignment bug), fix the overlapping student cards, and give students a profile area showing all their assignments incl. completed ones.

**Architecture:** Two repos. Web teacher dashboard (`mewstro-web`, Next.js, service-role Supabase client) gets an idempotency key end-to-end + a DB unique constraint. iOS (`Mewstro`, SwiftUI) gets a concurrency-safe assignment refresh + id-deduped rendering + a new read-only history view backed by a new RPC. DB changes applied via the Supabase MCP to project `nspgvdytqsvnmbitbmey`.

**Tech Stack:** Next.js 16 (App Router, server actions), `@supabase/supabase-js` (service role), Postgres/Supabase, SwiftUI + SwiftData, XCTest.

## Global Constraints
- Supabase project ref: `nspgvdytqsvnmbitbmey` (org "Meteora Mikey", Free plan). DB changes via Supabase MCP `apply_migration` (DDL) / `execute_sql` (verification). There is **no `supabase/` dir** in the mewstro-web main checkout.
- Web `getServerSupabase()` uses the **service-role** key → RLS is bypassed; correctness must be enforced by DB constraints, not RLS.
- mewstro-web has **no JS unit-test runner**. Web verification = `npx tsc --noEmit` + documented manual check. DB verification = `execute_sql`. iOS verification = XCTest (`MewstroTests`).
- Both repos are on `main` — create a feature branch in each before committing (`git checkout -b hobtrac-218-assignment-spine`).
- iOS instrument/voice and resources are NOT in this plan (separate plans for §2/§3/§4).
- Spec: `mewstro-web/docs/superpowers/specs/2026-06-21-josh-studio-loop-design.md` (§1, §1b).

---

### Task 1: DB — idempotency key on `mewstro_assignments`

**Files:**
- DB migration (via Supabase MCP `apply_migration`, name `add_assignments_idempotency_key`)

**Interfaces:**
- Produces: column `mewstro_assignments.idempotency_key uuid` with a partial unique index `mewstro_assignments_idempotency_key_uniq`.

- [ ] **Step 1: Apply the migration**

Use Supabase MCP `apply_migration` with `project_id: nspgvdytqsvnmbitbmey`, `name: add_assignments_idempotency_key`:

```sql
alter table public.mewstro_assignments
  add column if not exists idempotency_key uuid;

create unique index if not exists mewstro_assignments_idempotency_key_uniq
  on public.mewstro_assignments (idempotency_key)
  where idempotency_key is not null;
```

- [ ] **Step 2: Verify the constraint rejects a duplicate key**

Run via `execute_sql` (project `nspgvdytqsvnmbitbmey`):

```sql
do $$
declare sid uuid;
begin
  select id into sid from public.mewstro_studios where studio_name = 'Mewstro (Test)';
  insert into public.mewstro_assignments (studio_id, teacher_user_id, title, idempotency_key)
    values (sid, '00000000-0000-0000-0000-000000000001', 'idem test', '11111111-1111-1111-1111-111111111111');
  begin
    insert into public.mewstro_assignments (studio_id, teacher_user_id, title, idempotency_key)
      values (sid, '00000000-0000-0000-0000-000000000001', 'idem test 2', '11111111-1111-1111-1111-111111111111');
    raise exception 'FAIL: duplicate idempotency_key was allowed';
  exception when unique_violation then
    raise notice 'PASS: duplicate rejected';
  end;
  delete from public.mewstro_assignments where idempotency_key = '11111111-1111-1111-1111-111111111111';
end $$;
```

Expected: `NOTICE: PASS: duplicate rejected` and no rows left behind.

- [ ] **Step 3: Record the migration in git notes**

No `supabase/` dir exists, so document the applied DDL in the plan's repo for traceability:

```bash
mkdir -p mewstro-web/docs/db-migrations
printf '%s\n' '-- applied to nspgvdytqsvnmbitbmey 2026-06-21 via MCP' \
  '-- add_assignments_idempotency_key' > mewstro-web/docs/db-migrations/2026-06-21-add_assignments_idempotency_key.sql
# (append the two DDL statements from Step 1 into that file)
git add mewstro-web/docs/db-migrations/2026-06-21-add_assignments_idempotency_key.sql
git commit -m "db(218): add idempotency_key + unique index to mewstro_assignments"
```

---

### Task 2: Web — make `createAssignment` idempotent

**Files:**
- Modify: `mewstro-web/src/lib/teacher-queries.ts` (`createAssignment`, ~line 639)
- Modify: `mewstro-web/src/app/teacher/assignments/new/actions.ts`

**Interfaces:**
- Consumes: `mewstro_assignments.idempotency_key` (Task 1).
- Produces: `createAssignment(args: { studioName, title, description, dueDate, studentUserIds, idempotencyKey })` — idempotent on `idempotencyKey`.

- [ ] **Step 1: Add `idempotencyKey` to `createAssignment` and use upsert-ignore**

In `teacher-queries.ts`, change the `createAssignment` signature and the insert block. Replace the `.insert({...}).select("id").single()` assignment-insert with an idempotent path:

```ts
export async function createAssignment(args: {
  studioName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  studentUserIds: string[];
  idempotencyKey: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getServerSupabase();

  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id, teacher_email")
    .eq("studio_name", args.studioName)
    .single();
  if (studioErr || !studio) return { ok: false, error: "Studio not found" };

  const placeholderTeacherId = "00000000-0000-0000-0000-000000000001";

  // Idempotent insert: a retry with the same key is ignored. We then read
  // back the row for this key so a double-submit returns the SAME id.
  const { error: upsertErr } = await supabase
    .from("mewstro_assignments")
    .upsert(
      {
        studio_id: studio.id,
        teacher_user_id: placeholderTeacherId,
        title: args.title,
        description: args.description,
        due_date: args.dueDate,
        idempotency_key: args.idempotencyKey,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );
  if (upsertErr) return { ok: false, error: upsertErr.message };

  const { data: created, error: readErr } = await supabase
    .from("mewstro_assignments")
    .select("id")
    .eq("idempotency_key", args.idempotencyKey)
    .single();
  if (readErr || !created) {
    return { ok: false, error: readErr?.message ?? "Insert failed" };
  }

  // Targets: PK is (assignment_id, student_user_id) so re-inserting on a
  // retry is naturally idempotent — ignore duplicates.
  if (args.studentUserIds.length > 0) {
    const rows = args.studentUserIds.map((uid) => ({
      assignment_id: created.id,
      student_user_id: uid,
    }));
    const { error: targetErr } = await supabase
      .from("mewstro_assignment_targets")
      .upsert(rows, {
        onConflict: "assignment_id,student_user_id",
        ignoreDuplicates: true,
      });
    if (targetErr) {
      return { ok: false, error: `Assignment created but targets failed: ${targetErr.message}` };
    }
  }

  return { ok: true, id: created.id };
}
```

- [ ] **Step 2: Pass the key through the server action**

In `new/actions.ts`, read the hidden key and pass it down:

```ts
  const idempotencyKey = (formData.get("idempotencyKey") as string | null)?.trim() ?? "";
  if (!idempotencyKey) {
    redirect("/teacher/assignments/new?error=server");
  }
  // ...after studioName resolved...
  const result = await createAssignment({
    studioName,
    title,
    description,
    dueDate,
    studentUserIds: studentIds,
    idempotencyKey,
  });
```

- [ ] **Step 3: Typecheck**

Run: `cd mewstro-web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mewstro-web/src/lib/teacher-queries.ts mewstro-web/src/app/teacher/assignments/new/actions.ts
git commit -m "fix(218): idempotent createAssignment keyed on idempotency_key"
```

---

### Task 3: Web — mint key + disable submit while pending

**Files:**
- Create: `mewstro-web/src/app/teacher/assignments/new/SubmitButton.tsx`
- Modify: `mewstro-web/src/app/teacher/assignments/new/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a hidden `idempotencyKey` field + a `<SubmitButton>` that disables on submit.

- [ ] **Step 1: Create the client submit button**

```tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#2D8B7E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#246F64] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Creating…" : "Create assignment"}
    </button>
  );
}
```

- [ ] **Step 2: Mint the key + swap the button in the page**

In `page.tsx`: add `import { SubmitButton } from "./SubmitButton";` and `import { randomUUID } from "crypto";`. Inside the component (server component — runs per render) compute `const idempotencyKey = randomUUID();`. Add a hidden field as the first child of the `<form>`:

```tsx
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
```

Replace the existing inline submit `<button type="submit" …>Create assignment</button>` (lines ~184-189) with:

```tsx
          <SubmitButton />
```

- [ ] **Step 3: Typecheck + build**

Run: `cd mewstro-web && npx tsc --noEmit && npx next build`
Expected: compiles; `/teacher/assignments/new` builds.

- [ ] **Step 4: Manual double-submit verification**

Run `npm run dev`, open `/teacher/assignments/new` (logged in as a test studio), fill the form, and **double-click** Create. Expected: button disables after the first click; exactly one assignment appears in `/teacher/assignments`. Confirm with:

```sql
select count(*) from public.mewstro_assignments
where studio_id = (select id from public.mewstro_studios where studio_name = 'Mewstro (Test)')
  and title = '<the title you used>';
```

Expected: `1`.

- [ ] **Step 5: Commit**

```bash
git add mewstro-web/src/app/teacher/assignments/new/SubmitButton.tsx mewstro-web/src/app/teacher/assignments/new/page.tsx
git commit -m "fix(218): hidden idempotency key + disabled-on-pending submit"
```

---

### Task 4: Web — remove stale "on the roadmap" assignment copy

**Files:**
- Modify: `mewstro-web/src/app/teacher/assignments/page.tsx` (the `{/* What your students see — iOS preview */}` block, ~lines 132-170, and the `IOSAssignmentPreview` component if now unused)

**Interfaces:** none.

- [ ] **Step 1: Delete the stale block**

Remove the entire "On the roadmap / What your students will see / students don't see assignments inside the app yet" section (the closing `<div className="mt-12 …">` block) and delete the now-unused `IOSAssignmentPreview` function and its `formatDueDate(...).label` usage if it becomes unreferenced. Leave the assignment list + stats intact.

- [ ] **Step 2: Typecheck**

Run: `cd mewstro-web && npx tsc --noEmit`
Expected: no errors (no unused-symbol references to `IOSAssignmentPreview`).

- [ ] **Step 3: Commit**

```bash
git add mewstro-web/src/app/teacher/assignments/page.tsx
git commit -m "fix(218): remove stale 'assignments not in app yet' roadmap copy"
```

---

### Task 5: DB — clean up Josh's orphan duplicate assignment

**Files:** DB only (`execute_sql`).

**Interfaces:** none.

- [ ] **Step 1: Confirm the two duplicates still exist**

```sql
select id, title, created_at from public.mewstro_assignments
where studio_id = 'bce8078c-d857-461f-9852-bada7c6ebf75'
order by created_at;
```

Expected: two rows incl. `5ed9231d-7df5-45da-93c4-eec974a65e7f` (the later one).

- [ ] **Step 2: Delete the later duplicate + its children, in a transaction**

```sql
begin;
delete from public.mewstro_assignment_completions where assignment_id = '5ed9231d-7df5-45da-93c4-eec974a65e7f';
delete from public.mewstro_assignment_targets     where assignment_id = '5ed9231d-7df5-45da-93c4-eec974a65e7f';
delete from public.mewstro_assignments            where id           = '5ed9231d-7df5-45da-93c4-eec974a65e7f';
commit;
```

- [ ] **Step 3: Verify one assignment remains for Josh's studio**

```sql
select count(*) from public.mewstro_assignments where studio_id = 'bce8078c-d857-461f-9852-bada7c6ebf75';
```

Expected: `1`.

---

### Task 6: iOS — concurrency-safe refresh + id-deduped rendering (fix overlap)

**Files:**
- Modify: `Mewstro/Mewstro/Services/AssignmentService.swift`
- Create: `Mewstro/Mewstro/Views/Practice/AssignmentDedupe.swift` (pure helper)
- Modify: `Mewstro/Mewstro/Views/Practice/AssignmentsCard.swift` (~line 48 `ForEach`)
- Test: `Mewstro/MewstroTests/AssignmentDedupeTests.swift`

**Interfaces:**
- Produces: `func dedupedById(_ items: [Assignment]) -> [Assignment]` (keeps first occurrence per `id`, preserves order); `AssignmentService.refresh()` is non-reentrant.

- [ ] **Step 1: Write the failing dedupe test**

`Mewstro/MewstroTests/AssignmentDedupeTests.swift`:

```swift
import XCTest
import SwiftData
@testable import Mewstro

final class AssignmentDedupeTests: XCTestCase {
    func testDedupKeepsFirstPerIdPreservingOrder() {
        let id1 = UUID(), id2 = UUID()
        let a = Assignment(id: id1, studioId: UUID(), title: "A", teacherName: "T", studioName: "S", createdAt: .now)
        let aDup = Assignment(id: id1, studioId: UUID(), title: "A-dup", teacherName: "T", studioName: "S", createdAt: .now)
        let b = Assignment(id: id2, studioId: UUID(), title: "B", teacherName: "T", studioName: "S", createdAt: .now)
        let result = dedupedById([a, aDup, b])
        XCTAssertEqual(result.map(\.id), [id1, id2])
        XCTAssertEqual(result.first?.title, "A")
    }
}
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd Mewstro && xcodebuild test -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:MewstroTests/AssignmentDedupeTests`
Expected: FAIL — `dedupedById` not found.

- [ ] **Step 3: Implement the helper**

`Mewstro/Mewstro/Views/Practice/AssignmentDedupe.swift`:

```swift
import Foundation

/// Keeps the first occurrence of each assignment id, preserving order.
/// Defends the Practice/profile lists against duplicate SwiftData rows
/// (e.g. a same-id row inserted by overlapping refreshes) which would
/// otherwise collide in a SwiftUI ForEach and render overlapping cards.
func dedupedById(_ items: [Assignment]) -> [Assignment] {
    var seen = Set<UUID>()
    var out: [Assignment] = []
    for item in items where seen.insert(item.id).inserted {
        out.append(item)
    }
    return out
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: same command as Step 2. Expected: PASS.

- [ ] **Step 5: Make `refresh()` non-reentrant**

In `AssignmentService.swift`, add an in-flight guard so the `.task`, scenePhase, and parent-trigger callers can't run the check-then-insert concurrently. At the top of `refresh()`:

```swift
    private var isRefreshing = false

    func refresh() async {
        if isRefreshing { return }
        isRefreshing = true
        defer { isRefreshing = false }
        // ... existing body unchanged ...
    }
```

(The class is already `@MainActor`, so this flag is safe without locking.)

- [ ] **Step 6: Dedupe at the render site**

In `AssignmentsCard.swift`, replace `ForEach(assignments) { assignment in` with:

```swift
                    ForEach(dedupedById(assignments)) { assignment in
```

and update the count badge guard `if assignments.count > 1` to use `dedupedById(assignments).count > 1` (compute once into a `let visible = dedupedById(assignments)` at the top of the `if !assignments.isEmpty` branch and use `visible` for both).

- [ ] **Step 7: Build + test**

Run: `cd Mewstro && xcodebuild test -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:MewstroTests/AssignmentDedupeTests`
Expected: build succeeds, test PASS.

- [ ] **Step 8: Commit**

```bash
cd Mewstro
git add Mewstro/Services/AssignmentService.swift Mewstro/Views/Practice/AssignmentDedupe.swift Mewstro/Views/Practice/AssignmentsCard.swift MewstroTests/AssignmentDedupeTests.swift
git commit -m "fix(218): non-reentrant assignment refresh + id-deduped rendering"
```

---

### Task 7: DB — `mewstro_get_my_assignment_history` RPC

**Files:** DB migration via Supabase MCP `apply_migration`, name `mewstro_get_my_assignment_history`.

**Interfaces:**
- Produces: RPC returning `(id uuid, studio_id uuid, title text, description text, due_date date, created_at timestamptz, teacher_name text, studio_name text, completed_at timestamptz, completion_notes text)` for `auth.uid()`, newest first, completed and active together.

- [ ] **Step 1: Apply the migration**

```sql
create or replace function public.mewstro_get_my_assignment_history()
returns table (
  id uuid, studio_id uuid, title text, description text, due_date date,
  created_at timestamptz, teacher_name text, studio_name text,
  completed_at timestamptz, completion_notes text
)
language sql security definer set search_path to 'public' as $$
  select
    a.id, a.studio_id, a.title, a.description, a.due_date, a.created_at,
    s.teacher_name, s.studio_name,
    c.completed_at, c.notes as completion_notes
  from public.mewstro_assignment_targets t
  join public.mewstro_assignments a on a.id = t.assignment_id
  join public.mewstro_studios s on s.id = a.studio_id
  left join public.mewstro_assignment_completions c
    on c.assignment_id = a.id and c.student_user_id = auth.uid()
  where t.student_user_id = auth.uid()
  order by (c.completed_at is not null), a.due_date asc nulls last, a.created_at desc;
$$;

grant execute on function public.mewstro_get_my_assignment_history() to authenticated;
```

- [ ] **Step 2: Verify shape for a known student (Celine)**

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"5753377b-80ce-4673-9ae5-25d69b8bf8a6"}';
select id, title, completed_at is not null as done from public.mewstro_get_my_assignment_history();
reset role;
```

Expected: rows for Celine incl. the completed one (`done = true`), active rows first.

- [ ] **Step 3: Document migration + commit**

```bash
printf '%s\n' '-- applied to nspgvdytqsvnmbitbmey 2026-06-21 via MCP' \
  '-- mewstro_get_my_assignment_history' > mewstro-web/docs/db-migrations/2026-06-21-mewstro_get_my_assignment_history.sql
# (append the function DDL from Step 1)
git add mewstro-web/docs/db-migrations/2026-06-21-mewstro_get_my_assignment_history.sql
git commit -m "db(1b): mewstro_get_my_assignment_history RPC (active + completed)"
```

---

### Task 8: iOS — student assignment history view (§1b)

**Files:**
- Create: `Mewstro/Shared/SharedModels/AssignmentHistoryDTO.swift`
- Create: `Mewstro/Mewstro/Services/AssignmentHistoryService.swift`
- Create: `Mewstro/Mewstro/Views/Settings/AssignmentHistoryView.swift`
- Modify: `Mewstro/Mewstro/Views/Settings/SettingsTabView.swift` (add a navigation row)
- Test: `Mewstro/MewstroTests/AssignmentHistoryGroupingTests.swift`

**Interfaces:**
- Consumes: RPC `mewstro_get_my_assignment_history` (Task 7); `SupabaseRestClient.callRPC` (existing).
- Produces: `AssignmentHistoryItem` (decoded), `splitHistory(_:) -> (active: [AssignmentHistoryItem], completed: [AssignmentHistoryItem])`.

- [ ] **Step 1: DTO**

`Mewstro/Shared/SharedModels/AssignmentHistoryDTO.swift`:

```swift
import Foundation

struct AssignmentHistoryItem: Codable, Identifiable {
    let id: UUID
    let title: String
    let description: String?
    let dueDate: Date?
    let createdAt: Date
    let teacherName: String
    let studioName: String
    let completedAt: Date?
    let completionNotes: String?

    var isComplete: Bool { completedAt != nil }

    enum CodingKeys: String, CodingKey {
        case id, title, description
        case dueDate = "due_date"
        case createdAt = "created_at"
        case teacherName = "teacher_name"
        case studioName = "studio_name"
        case completedAt = "completed_at"
        case completionNotes = "completion_notes"
    }
}

func splitHistory(_ items: [AssignmentHistoryItem]) -> (active: [AssignmentHistoryItem], completed: [AssignmentHistoryItem]) {
    (items.filter { !$0.isComplete }, items.filter { $0.isComplete })
}
```

- [ ] **Step 2: Failing grouping test**

`Mewstro/MewstroTests/AssignmentHistoryGroupingTests.swift`:

```swift
import XCTest
@testable import Mewstro

final class AssignmentHistoryGroupingTests: XCTestCase {
    func testSplitSeparatesCompleteFromActive() {
        let active = AssignmentHistoryItem(id: UUID(), title: "A", description: nil, dueDate: nil, createdAt: .now, teacherName: "T", studioName: "S", completedAt: nil, completionNotes: nil)
        let done = AssignmentHistoryItem(id: UUID(), title: "B", description: nil, dueDate: nil, createdAt: .now, teacherName: "T", studioName: "S", completedAt: .now, completionNotes: "nice")
        let (a, c) = splitHistory([active, done])
        XCTAssertEqual(a.map(\.title), ["A"])
        XCTAssertEqual(c.map(\.title), ["B"])
    }
}
```

- [ ] **Step 3: Run, verify fail**

Run: `cd Mewstro && xcodebuild test -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:MewstroTests/AssignmentHistoryGroupingTests`
Expected: FAIL — symbols not found.

- [ ] **Step 4: Service**

`Mewstro/Mewstro/Services/AssignmentHistoryService.swift`:

```swift
import Foundation

@Observable
@MainActor
final class AssignmentHistoryService {
    private weak var authService: AuthService?
    var items: [AssignmentHistoryItem] = []
    var isLoading = false
    var lastError: String?

    init(authService: AuthService?) { self.authService = authService }

    func load() async {
        guard let token = authService?.accessToken else {
            lastError = "Not signed in."; return
        }
        isLoading = true; lastError = nil
        defer { isLoading = false }
        do {
            let remote: [AssignmentHistoryItem] = try await SupabaseRestClient.callRPC(
                name: "mewstro_get_my_assignment_history",
                params: [:],
                accessToken: token,
                refreshTokenHandler: { [weak self] in await self?.authService?.refreshAccessToken() }
            )
            items = remote
        } catch {
            lastError = error.localizedDescription
        }
    }
}
```

- [ ] **Step 5: View** (run Step 3's test command after — it covers Steps 1/4 symbols too)

`Mewstro/Mewstro/Views/Settings/AssignmentHistoryView.swift`:

```swift
import SwiftUI

struct AssignmentHistoryView: View {
    @Environment(AuthService.self) private var authService
    @State private var service: AssignmentHistoryService?

    var body: some View {
        let groups = splitHistory(service?.items ?? [])
        List {
            if let s = service, s.isLoading, (service?.items ?? []).isEmpty {
                HStack { ProgressView().controlSize(.small); Text("Loading…") }
            }
            if !groups.active.isEmpty {
                Section("Active") { ForEach(groups.active) { row($0) } }
            }
            if !groups.completed.isEmpty {
                Section("Completed") { ForEach(groups.completed) { row($0) } }
            }
            if let s = service, let err = s.lastError {
                Section { Text(err).font(.caption).foregroundStyle(.red) }
            }
        }
        .navigationTitle("Assignments")
        .task {
            if service == nil { service = AssignmentHistoryService(authService: authService) }
            await service?.load()
        }
    }

    @ViewBuilder private func row(_ a: AssignmentHistoryItem) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                if a.isComplete { Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.mewstroPrimary) }
                Text(a.title).font(.subheadline.weight(.semibold))
            }
            if let d = a.description, !d.isEmpty {
                Text(d).font(.caption).foregroundStyle(Color.mewstroTextSecondary).lineLimit(2)
            }
            HStack(spacing: 6) {
                Text(a.teacherName).font(.caption2).foregroundStyle(Color.mewstroPrimary)
                if let done = a.completedAt {
                    Text("· Completed \(done.formatted(date: .abbreviated, time: .omitted))").font(.caption2).foregroundStyle(Color.mewstroTextSecondary)
                } else if let due = a.dueDate {
                    Text("· Due \(due.formatted(date: .abbreviated, time: .omitted))").font(.caption2).foregroundStyle(due < .now ? .red : Color.mewstroTextSecondary)
                }
            }
            if let notes = a.completionNotes, !notes.isEmpty {
                Text("“\(notes)”").font(.caption2).italic().foregroundStyle(Color.mewstroPrimary)
            }
        }
        .padding(.vertical, 2)
    }
}
```

- [ ] **Step 6: Add the Settings row**

In `SettingsTabView.swift`, add a `NavigationLink` (match the file's existing row style/section) to surface the view:

```swift
                NavigationLink {
                    AssignmentHistoryView()
                } label: {
                    Label("Assignments", systemImage: "checklist")
                }
```

(Place it in the most appropriate existing `Section`; if the file wraps content in a `NavigationStack`/`List`, follow that. Do not introduce a second `NavigationStack` if one already wraps the tab.)

- [ ] **Step 7: Build + run tests**

Run: `cd Mewstro && xcodebuild test -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:MewstroTests/AssignmentHistoryGroupingTests`
Expected: build succeeds; test PASS.

- [ ] **Step 8: Manual check**

Run the app as Celine (or any student with completed assignments), open Settings → Assignments. Expected: an "Active" and a "Completed" section; completed items show the completion date and any note.

- [ ] **Step 9: Commit**

```bash
cd Mewstro
git add Mewstro/Views/Settings/AssignmentHistoryView.swift Mewstro/Views/Settings/SettingsTabView.swift Mewstro/Services/AssignmentHistoryService.swift Shared/SharedModels/AssignmentHistoryDTO.swift MewstroTests/AssignmentHistoryGroupingTests.swift
git commit -m "feat(1b): student assignment history in Settings (active + completed)"
```

---

## Self-Review

**Spec coverage (§1 + §1b):**
- §1 web idempotency → Tasks 2, 3. DB guard → Task 1. iOS overlap/concurrency → Task 6. Data cleanup → Task 5. Stale copy → Task 4. ✓
- §1b history RPC → Task 7; iOS Profile/Settings view → Task 8. ✓
- §2, §3, §4, E intentionally excluded (separate plans). ✓

**Placeholder scan:** No TBD/TODO; every code step has full code. The Settings-row placement (Task 8 Step 6) gives explicit guidance to follow the existing structure rather than a vague "add appropriately" — acceptable because the surrounding file's section layout is the authority.

**Type consistency:** `dedupedById([Assignment]) -> [Assignment]` used identically in Task 6 Steps 3/6. `createAssignment(... idempotencyKey)` defined in Task 2 and fed in Task 2 Step 2. RPC column set in Task 7 matches `AssignmentHistoryItem` CodingKeys in Task 8. `splitHistory`/`AssignmentHistoryItem` consistent across Tasks 8 Steps 1/2/5.

**Known risk:** the exact simulator name (`iPhone 16`) may differ on the machine — adjust `-destination` to an installed simulator if `xcodebuild` reports the device is unavailable.
