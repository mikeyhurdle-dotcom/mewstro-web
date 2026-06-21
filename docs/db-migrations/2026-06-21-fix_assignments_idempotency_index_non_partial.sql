-- applied to nspgvdytqsvnmbitbmey 2026-06-21 via MCP
-- fix_assignments_idempotency_index_non_partial
-- Reason: the partial predicate made the index non-inferable by PostgREST's
-- ON CONFLICT (idempotency_key), causing 42P10. Replaced with a plain
-- non-partial unique index (column stays nullable; NULLs are distinct).
drop index if exists public.mewstro_assignments_idempotency_key_uniq;
create unique index mewstro_assignments_idempotency_key_uniq
  on public.mewstro_assignments (idempotency_key);
