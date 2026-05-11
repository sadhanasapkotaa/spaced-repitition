-- Task ↔ folder linkage now cascades to descendant folders.
--
-- Before: linking a task to folder A only included cards whose folder_id
-- equals A directly. Subfolders' cards were ignored unless explicitly
-- linked too.
--
-- After: linking a task to A includes A's cards plus every descendant
-- folder's cards. The expansion is computed via a recursive CTE.

-- ============================================================
-- Helper function: get all folder ids covered by a task's links,
-- including descendants. Used by app code via RPC.
-- ============================================================
create or replace function public.get_task_folder_ids(task_uuid uuid)
returns setof uuid
language sql
stable
as $$
  with recursive expanded as (
    select tf.folder_id
    from public.task_folders tf
    where tf.task_id = task_uuid

    union  -- dedupes; protects against accidental cycles too

    select child.id
    from public.folders child
    join expanded e on child.parent_id = e.folder_id
  )
  select folder_id from expanded
$$;

grant execute on function public.get_task_folder_ids(uuid) to authenticated;

-- ============================================================
-- Replace the task_progress view to recurse through subfolders.
-- ============================================================
drop view if exists public.task_progress;

create view public.task_progress
with (security_invoker = true)
as
with recursive expanded_folders as (
  select tf.task_id, tf.folder_id
  from public.task_folders tf

  union

  select e.task_id, child.id
  from public.folders child
  join expanded_folders e on child.parent_id = e.folder_id
)
select
  t.id as task_id,
  t.name as task_name,
  count(distinct c.id)::int as total_cards,
  count(distinct c.id) filter (
    where c.next_review_time is not null and c.next_review_time <= now()
  )::int as due_cards,
  count(distinct cr.id)::int as total_reviews,
  count(distinct cr.id) filter (where cr.outcome = 'pass')::int as passed_reviews,
  count(distinct cr.id) filter (where cr.outcome = 'fail')::int as failed_reviews,
  count(distinct cr.id) filter (where cr.outcome = 'hard')::int as hard_reviews
from public.tasks t
left join expanded_folders ef on ef.task_id = t.id
left join public.cards c on c.folder_id = ef.folder_id
left join public.card_reviews cr on cr.card_id = c.id
group by t.id, t.name;

-- Refresh the API's view of the schema.
notify pgrst, 'reload schema';
