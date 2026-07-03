-- Teacher login telemetry (magic-link auth design doc §4).
-- One row per successful teacher sign-in; the OpenClaw mewstro collector
-- reads this to surface "last teacher login" per studio — the leading
-- indicator of a pilot that's actually sticking.
--
-- Apply manually to the live project (nspgvdytqsvnmbitbmey). The web app
-- inserts best-effort: if this table is missing, sign-in still works and
-- the insert failure is only logged.

create table if not exists public.mewstro_teacher_login_events (
  id uuid primary key default gen_random_uuid(),
  teacher_email text not null,
  studio_id uuid references public.mewstro_studios (id) on delete set null,
  event text not null default 'magic_link_login',
  created_at timestamptz not null default now()
);

create index if not exists mewstro_teacher_login_events_studio_idx
  on public.mewstro_teacher_login_events (studio_id, created_at desc);

create index if not exists mewstro_teacher_login_events_email_idx
  on public.mewstro_teacher_login_events (teacher_email, created_at desc);

-- Written by the service-role client only; no client-side access needed.
alter table public.mewstro_teacher_login_events enable row level security;
