# Studio Materials — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`).

**Goal:** Teachers create studio materials (web links, YouTube/Vimeo embeds, uploaded PDFs) targeted at the whole studio / an instrument / a named student; students see the ones targeting them on iOS and the `/practice` web portal.

**Architecture:** New `mewstro_studio_resources` table + `mewstro_get_my_resources()` SECURITY DEFINER RPC (mirrors `mewstro_get_my_assignments`). PDFs in a private `studio-resources` Storage bucket with an entitlement-based RLS read policy (mirrors `milestones_studio_read`) + short-lived signed URLs. Teacher CRUD via service-role dashboard helpers (scope-guarded like repertoire). Student delivery via the RPC on iOS (`SupabaseRestClient.callRPC`) and the portal (practice supabase client). Soft-delete (`deleted_at`).

**Tech Stack:** Supabase/Postgres (MCP, project `nspgvdytqsvnmbitbmey`), Next.js 16 App Router (service-role + practice anon/SSR client), SwiftUI + SwiftData + XCTest.

## Global Constraints
- DB via Supabase MCP. Branch off `main` in BOTH repos (`hobtrac-219-studio-materials`); `git -C <abs>`; commits end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Confirmed schema: `mewstro_user_profiles.instruments` is **text[]**; `mewstro_leaderboard_memberships` has **studio_id** + user_id; `mewstro_studios` has id/studio_name/teacher_name; reuse the existing `set_updated_at()` trigger fn.
- Web gates: `npx tsc --noEmit` + `npx next build` (no JS unit runner). `getServerSupabase()` = service-role (RLS bypassed) — teacher writes MUST be studio-scope-guarded (`studentInStudio()` for student-targeted; studio resolution for the rest).
- iOS: sim `iPhone 17`; tests `MewstroTests`.
- **PDF: 25 MB max, application/pdf only** — enforce client-side (reject before upload) AND server-side (size + mime). IP attestation checkbox required on document upload.
- Patterns to mirror: assignments (`mewstro_get_my_assignments`, `AssignmentsCard`, portal `AssignmentsList.tsx`/`src/lib/practice/assignments.ts`, `AssignmentHistoryView`); milestones (`milestones_studio_read` storage RLS + `AppConstants.milestoneSignedURLLifetimeSeconds`).
- Spec: `mewstro-web/docs/superpowers/specs/2026-06-22-studio-materials-design.md`.

---

### Task 1: DB — `mewstro_studio_resources` table + RPC

**Files:** Supabase MCP `apply_migration` name `studio_resources`; doc `mewstro-web/docs/db-migrations/2026-06-23-studio_resources.sql`.

- [ ] **Step 1: Apply migration**
```sql
create table if not exists public.mewstro_studio_resources (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.mewstro_studios(id) on delete cascade,
  created_by uuid,
  type text not null check (type in ('link','embed','document')),
  title text not null,
  description text,
  url text,
  storage_path text,
  audience text not null check (audience in ('studio','instrument','student')),
  audience_instrument text,
  audience_student_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint resource_payload_ck check (
    (type = 'document' and storage_path is not null) or
    (type in ('link','embed') and url is not null)
  ),
  constraint resource_audience_ck check (
    (audience = 'instrument' and audience_instrument is not null) or
    (audience = 'student' and audience_student_user_id is not null) or
    (audience = 'studio')
  )
);
create index if not exists idx_studio_resources_studio on public.mewstro_studio_resources(studio_id) where deleted_at is null;
create index if not exists idx_studio_resources_student on public.mewstro_studio_resources(audience_student_user_id) where deleted_at is null;

drop trigger if exists trg_studio_resources_updated_at on public.mewstro_studio_resources;
create trigger trg_studio_resources_updated_at before update on public.mewstro_studio_resources
  for each row execute function public.set_updated_at();

alter table public.mewstro_studio_resources enable row level security;
-- No student-facing table policies: reads go through the SECURITY DEFINER RPC; writes are service-role.

create or replace function public.mewstro_get_my_resources()
returns table (id uuid, studio_id uuid, type text, title text, description text,
  url text, storage_path text, audience text, created_at timestamptz,
  studio_name text, teacher_name text)
language sql security definer set search_path to 'public' as $$
  with my_studios as (
    select studio_id from public.mewstro_leaderboard_memberships where user_id = auth.uid()
  ),
  my_instruments as (
    select coalesce(instruments, '{}'::text[]) as instruments
    from public.mewstro_user_profiles where user_id = auth.uid()
  )
  select r.id, r.studio_id, r.type, r.title, r.description, r.url, r.storage_path,
         r.audience, r.created_at, s.studio_name, s.teacher_name
  from public.mewstro_studio_resources r
  join public.mewstro_studios s on s.id = r.studio_id
  where r.deleted_at is null
    and r.studio_id in (select studio_id from my_studios)
    and (
      r.audience = 'studio'
      or (r.audience = 'instrument'
          and r.audience_instrument = any(coalesce((select instruments from my_instruments), '{}'::text[])))
      or (r.audience = 'student' and r.audience_student_user_id = auth.uid())
    )
  order by r.created_at desc;
$$;
grant execute on function public.mewstro_get_my_resources() to authenticated;
```

- [ ] **Step 2: Verify** via `execute_sql` against project `nspgvdytqsvnmbitbmey`:
  - Insert 3 test rows in the "Mewstro (Test)" studio: one `audience=studio`, one `audience=instrument` (`audience_instrument='piano'`), one `audience=student` (a real test student's user_id).
  - Impersonate that student: `set local role authenticated; set local request.jwt.claims = '{"sub":"<student-uuid>"}';` then `select id, audience from public.mewstro_get_my_resources();` — expect the studio one + the student one, and the instrument one ONLY if that student's `mewstro_user_profiles.instruments` contains 'piano'.
  - `reset role;` then DELETE the 3 test rows. Confirm cleanup.

- [ ] **Step 3: Doc + commit** (branch `hobtrac-219-studio-materials` in mewstro-web): write the DDL to `docs/db-migrations/2026-06-23-studio_resources.sql` (header `-- applied to nspgvdytqsvnmbitbmey 2026-06-23 via MCP`); `git commit -m "db(219 §3): mewstro_studio_resources table + get_my_resources RPC"`.

---

### Task 2: Storage — `studio-resources` bucket + entitlement RLS

**Files:** Supabase MCP (`execute_sql` for bucket insert + storage policies); doc note appended to the migration doc.

- [ ] **Step 1: Create the private bucket + read policy**
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-resources','studio-resources', false, 26214400, array['application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Entitlement read policy (mirror milestones_studio_read): a caller may read an object iff a
-- non-deleted resource row references it AND the audience rules grant them access.
drop policy if exists studio_resources_read on storage.objects;
create policy studio_resources_read on storage.objects for select to authenticated using (
  bucket_id = 'studio-resources' and exists (
    select 1
    from public.mewstro_studio_resources r
    join public.mewstro_leaderboard_memberships m
      on m.studio_id = r.studio_id and m.user_id = auth.uid()
    left join public.mewstro_user_profiles p on p.user_id = auth.uid()
    where r.storage_path = storage.objects.name
      and r.deleted_at is null
      and (
        r.audience = 'studio'
        or (r.audience = 'instrument' and r.audience_instrument = any(coalesce(p.instruments,'{}'::text[])))
        or (r.audience = 'student' and r.audience_student_user_id = auth.uid())
      )
  )
);
```
(Note: the 26214400 = 25 MiB file_size_limit + mime restriction enforce the cap at the platform level too.)

- [ ] **Step 2: Verify** the bucket exists (`select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='studio-resources';`) and the policy exists (`select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname='studio_resources_read';`).

- [ ] **Step 3: Append to migration doc + commit** `db(219 §3): studio-resources private bucket + entitlement RLS`.

---

### Task 3: Web — resource query helpers + link/embed server actions

**Files:** `mewstro-web/src/lib/teacher-queries.ts` (helpers); `mewstro-web/src/app/teacher/materials/actions.ts` (NEW, "use server").

**Interfaces:** `listStudioResources(studioName)`, `createResource(args)`, `updateResource(args)`, `softDeleteResource(id, studioName)`; server actions `createResourceAction/updateResourceAction/deleteResourceAction`.

- [ ] **Step 1: Helpers** (service-role). `listStudioResources` selects non-deleted rows for the studio (resolve studio_id via `mewstro_studios`). `createResource` inserts (studio_id resolved from studioName; for `audience=student` the action must have verified `studentInStudio`). `updateResource` updates editable fields by id scoped `.eq("studio_id", studioId)`. `softDeleteResource` sets `deleted_at` scoped by studio_id. Do NOT set `updated_at` (trigger owns it).
- [ ] **Step 2: Server actions** (`materials/actions.ts`, file-level "use server"): resolve `getActiveStudioName()` (redirect to /teacher/login if null); for student-audience, call `studentInStudio(studentId, studioName)` and reject on false; validate `type ∈ {link,embed,document}` and `audience ∈ {studio,instrument,student}`; for link/embed require a URL; call helpers; `revalidatePath('/teacher/materials')`. (Document creation is Task 5.)
- [ ] **Step 3:** `cd mewstro-web && npx tsc --noEmit` → clean. Commit `feat(219 §3): studio resource query helpers + link/embed actions`.

---

### Task 4: Web — `/teacher/materials` page + nav

**Files:** `mewstro-web/src/app/teacher/materials/page.tsx` (NEW), `mewstro-web/src/app/teacher/materials/MaterialsManager.tsx` (NEW client); modify `src/app/teacher/page.tsx` (add a nav card/link).

- [ ] **Step 1: Page** (server component) — resolve studio, `listStudioResources`, render the list grouped/badged by audience; render `<MaterialsManager>` for add/edit/delete.
- [ ] **Step 2: Client `MaterialsManager`** — "Add material" form: type picker (link/embed/document — document disabled until Task 5 wires upload, OR include now if Task 5 lands first), title, description, audience selector (studio / instrument dropdown from the `Instrument` list / student dropdown from studio students passed as a prop), URL field for link/embed. Edit + delete (confirm) per row. Mirror `RepertoireEditor.tsx` patterns + the new-assignment form's student select.
- [ ] **Step 3:** Add a "Studio materials" entry to the teacher home (`src/app/teacher/page.tsx`) near the assignments link.
- [ ] **Step 4:** `npx tsc --noEmit && npx next build` → `/teacher/materials` builds. Commit `feat(219 §3): teacher /teacher/materials CRUD page + nav`.

---

### Task 5: Web — PDF upload (document resources)

**Files:** `mewstro-web/src/app/teacher/materials/actions.ts` (add `uploadDocumentResourceAction`); `MaterialsManager.tsx` (file input + IP checkbox); helper in `teacher-queries.ts` for the storage upload.

- [ ] **Step 1:** In the add form, when type=document: a `<input type="file" accept="application/pdf">`, a required **IP-attestation checkbox**, plus title/description/audience. Client guard: reject if not application/pdf or size > 25 MB (26214400 bytes) before submit.
- [ ] **Step 2:** `uploadDocumentResourceAction` (service-role): re-validate mime=application/pdf + size ≤ 25 MB AND the IP checkbox is checked (reject otherwise); upload the file to `studio-resources/<studio_id>/<crypto.randomUUID()>.pdf` via `supabase.storage.from('studio-resources').upload(...)`; insert a `type='document'` row with that `storage_path`; scope-guard (studio + studentInStudio if student-audience); `revalidatePath`.
- [ ] **Step 3:** `npx tsc --noEmit && npx next build`. Commit `feat(219 §3): teacher PDF document upload (25MB/PDF guard + IP attestation)`.

---

### Task 6: Web — "Add material for this student" on the student page

**Files:** `mewstro-web/src/app/teacher/students/[studentId]/page.tsx` + a small client entry (reuse `MaterialsManager` in a student-scoped mode, or a link to `/teacher/materials?student=<id>`).

- [ ] **Step 1:** Add an "Add material" affordance on the student dashboard that pre-sets `audience=student` for that student (simplest: link to `/teacher/materials?student=<userId>&studentName=<name>`; have the materials page read the param and pre-select student audience, mirroring how the new-assignment form reads `?student=`).
- [ ] **Step 2:** `npx tsc --noEmit && npx next build`. Commit `feat(219 §3): add-material-for-student entry on student page`.

---

### Task 7: iOS — resource DTO + service

**Files:** `Mewstro/Shared/SharedModels/StudioResourceDTO.swift` (NEW); `Mewstro/Mewstro/Services/StudioResourceService.swift` (NEW); test `MewstroTests/StudioResourceGroupingTests.swift` if any pure logic (e.g. grouping by audience).

**Interfaces:** `StudioResourceItem` (Codable, snake_case CodingKeys matching the RPC columns incl. `storage_path`); `StudioResourceService.load()` calls `mewstro_get_my_resources` via `SupabaseRestClient.callRPC` (mirror `AssignmentHistoryService`).

- [ ] **Step 1:** DTO with fields id,type,title,description,url,storagePath,audience,createdAt,studioName,teacherName. TDD a small pure helper if you add grouping; otherwise no unit test needed (service is integration).
- [ ] **Step 2:** Service mirrors `AssignmentHistoryService` (token guard, callRPC, refresh handler). Add files to the app/test targets in pbxproj.
- [ ] **Step 3:** `xcodebuild build -scheme Mewstro -destination 'platform=iOS Simulator,name=iPhone 17'` → succeeds (+ run any new test). Commit `feat(219 §3): iOS studio resource DTO + service`.

---

### Task 8: iOS — Materials view + placement

**Files:** `Mewstro/Mewstro/Views/Settings/StudioMaterialsView.swift` (NEW); modify `SettingsTabView.swift` (NavigationLink, like `AssignmentHistoryView`).

- [ ] **Step 1:** A read-only list grouped/sectioned, fetched on `.task`. `link`/`embed` → open externally (SFSafariViewController / `openURL`). `document` → fetch a signed URL via the authed storage client (`createSignedURL`, lifetime `AppConstants.milestoneSignedURLLifetimeSeconds`) for the row's `storage_path`, then open the PDF (reuse the milestone playback/quicklook pattern). Empty-state when none.
- [ ] **Step 2:** Add a "Materials" / "From your teacher" `NavigationLink` to the Settings categories section (same place as the Assignments history row).
- [ ] **Step 3:** `xcodebuild build … iPhone 17` → succeeds. Commit `feat(219 §3): iOS Studio Materials view in Settings`.

---

### Task 9: Web portal — `/practice` materials page

**Files:** `mewstro-web/src/app/practice/(app)/materials/page.tsx` (NEW) + `src/components/practice/MaterialsList.tsx` (NEW) + `src/lib/practice/resources.ts` (NEW read helper); modify `src/components/practice/PortalNav.tsx` (add a Materials tab).

- [ ] **Step 1:** `src/lib/practice/resources.ts` — call `mewstro_get_my_resources` via the practice supabase client (authed, anon key; the RPC is SECURITY DEFINER granted to authenticated, so the portal user gets their own resources). Mirror `src/lib/practice/assignments.ts`.
- [ ] **Step 2:** `MaterialsList` + page — render the list; link/embed open in a new tab; document → `supabase.storage.from('studio-resources').createSignedUrl(storage_path, 300)` then open. Mirror `AssignmentsList.tsx`.
- [ ] **Step 3:** Add a Materials entry to `PortalNav.tsx`.
- [ ] **Step 4:** `npx tsc --noEmit && npx next build` → `/practice/materials` builds. Commit `feat(219 §3): /practice web-portal materials page`.

---

### Task 10: Manual verification (required)
- [ ] Teacher creates a studio-wide link, an instrument-targeted embed, a student-targeted PDF on `/teacher/materials`.
- [ ] Student (matching instrument) sees all three on iOS + `/practice/materials`; non-matching-instrument student does NOT see the instrument one; other-studio student sees none.
- [ ] PDF opens via signed URL for an entitled student; a direct object URL is denied for a non-entitled user (RLS).
- [ ] >25 MB / non-PDF upload rejected; IP attestation required.
- [ ] Soft-deleted material disappears from teacher list, iOS, and portal.

## Self-Review
- Spec coverage: table+RPC (T1), bucket+RLS (T2), teacher link/embed (T3,T4), PDF (T5), per-student (T6), iOS (T7,T8), portal (T9), manual matrix (T10). ✓
- Placeholder scan: instruments text[] confirmed; RPC + RLS use `= any(instruments)`. teacher_name/studio_name confirmed on mewstro_studios. No TBDs.
- Type consistency: RPC column set == StudioResourceDTO fields (T7) == portal read (T9). `storage_path` carried through for documents.
- Risk: storage RLS entitlement join is the security-critical piece (mirror milestones_studio_read exactly) — final review must verify cross-tenant/non-entitled denial. Scope-guard teacher writes (service-role) as in repertoire.
