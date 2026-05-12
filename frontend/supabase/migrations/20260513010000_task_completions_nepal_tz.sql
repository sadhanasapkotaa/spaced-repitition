-- The day boundary for task check-offs is midnight Nepal Time
-- (Asia/Kathmandu, UTC+05:45). Replaces the previous current_date (UTC)
-- behaviour: a user marking a task done at 23:50 NPT counts for that
-- Nepali day, not the next UTC day.

create or replace function public.nepal_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Kathmandu')::date;
$$;

-- Default for new rows comes from the function instead of UTC current_date.
alter table public.task_completions
  alter column completed_on set default public.nepal_today();

-- Rewrite the today-only insert/delete policies against the new function.
drop policy if exists "users insert own task_completions for today"
  on public.task_completions;
drop policy if exists "users delete own task_completions for today"
  on public.task_completions;

create policy "users insert own task_completions for today"
  on public.task_completions for insert
  with check (
    completed_on = public.nepal_today()
    and exists (
      select 1 from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = public.current_user_id()
    )
  );

create policy "users delete own task_completions for today"
  on public.task_completions for delete
  using (
    completed_on = public.nepal_today()
    and exists (
      select 1 from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = public.current_user_id()
    )
  );
