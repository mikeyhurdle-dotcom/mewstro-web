-- applied to nspgvdytqsvnmbitbmey 2026-06-22 via MCP
-- repertoire_updated_at_and_soft_delete: server-authoritative updated_at (trigger) + deleted_at tombstone
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
