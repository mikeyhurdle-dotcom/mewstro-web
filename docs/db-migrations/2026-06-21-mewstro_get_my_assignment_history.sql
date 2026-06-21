-- applied to nspgvdytqsvnmbitbmey 2026-06-21 via MCP
-- mewstro_get_my_assignment_history
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
