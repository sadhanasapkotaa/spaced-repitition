-- Per-task daily check-off log used to compute per-task streaks and the
-- dashboard's per-task chart. Past-day rows are immutable from the client:
-- the server action only ever writes/deletes today's row (completed_on
-- defaults to current_date and is rejected by RLS for any other value).

create table public.task_completions (
  task_id      uuid       not null references public.tasks(id) on delete cascade,
  completed_on date       not null default current_date,
  completed_at timestamptz not null default now(),
  primary key (task_id, completed_on)
);

create index idx_task_completions_task_id      on public.task_completions(task_id);
create index idx_task_completions_completed_on on public.task_completions(completed_on);

alter table public.task_completions enable row level security;

-- A user may only see/modify completions for tasks they own, AND may only
-- ever insert/delete the row for today's date. Yesterday is locked in.
create policy "users see own task_completions"
  on public.task_completions for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = public.current_user_id()
    )
  );

create policy "users insert own task_completions for today"
  on public.task_completions for insert
  with check (
    completed_on = current_date
    and exists (
      select 1 from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = public.current_user_id()
    )
  );

create policy "users delete own task_completions for today"
  on public.task_completions for delete
  using (
    completed_on = current_date
    and exists (
      select 1 from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = public.current_user_id()
    )
  );
-- (no update policy => task_completions rows cannot be updated at all)
