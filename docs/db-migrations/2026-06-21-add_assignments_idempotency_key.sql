-- applied to nspgvdytqsvnmbitbmey 2026-06-21 via MCP
-- add_assignments_idempotency_key

alter table public.mewstro_assignments
  add column if not exists idempotency_key uuid;

create unique index if not exists mewstro_assignments_idempotency_key_uniq
  on public.mewstro_assignments (idempotency_key)
  where idempotency_key is not null;
-- NOTE: the partial WHERE predicate below was SUPERSEDED on 2026-06-21 by 2026-06-21-fix_assignments_idempotency_index_non_partial.sql (partial index is not ON CONFLICT-inferable).
