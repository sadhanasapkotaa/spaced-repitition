-- Spaced Repetition schema for Supabase (PostgreSQL)
-- Run with: supabase db push (if using Supabase CLI)

create extension if not exists pgcrypto;

-- Enums
create type public.review_outcome as enum ('pass', 'fail', 'hard');

-- Core content
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."User"(id) on delete cascade,
  name text not null,
  parent_id uuid null references public.folders(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."User"(id) on delete cascade,
  folder_id uuid null references public.folders(id) on delete set null,
  front text not null,
  back text not null,
  hint text null,
  is_flagged boolean not null default false,
  difficulty numeric(4,2) not null default 2.50 check (difficulty > 0),
  repeat_interval integer not null default 0 check (repeat_interval >= 0),
  last_review_time timestamptz null,
  next_review_time timestamptz null,
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."User"(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_user_name_unique unique (user_id, name)
);

create table public.card_tags (
  card_id uuid not null references public.cards(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (card_id, tag_id)
);

-- Task planning
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."User"(id) on delete cascade,
  name text not null,
  is_completed boolean not null default false,
  start_date date null,
  due_date date null,
  created_at timestamptz not null default now(),
  constraint tasks_due_after_start check (
    due_date is null or start_date is null or due_date >= start_date
  )
);

create table public.task_folders (
  task_id uuid not null references public.tasks(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  primary key (task_id, folder_id)
);

-- User-level settings and streaks (1 row per auth user)
create table public.user_settings (
  id bigint primary key references public."User"(id) on delete cascade,
  daily_goal integer not null default 20 check (daily_goal > 0),
  updated_at timestamptz not null default now()
);

create table public.user_streaks (
  id bigint primary key references public."User"(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_reviewed_date date null,
  updated_at timestamptz not null default now()
);

-- Review sessions and history
create table public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."User"(id) on delete cascade,
  task_id uuid null references public.tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  cards_reviewed integer not null default 0 check (cards_reviewed >= 0),
  cards_passed integer not null default 0 check (cards_passed >= 0),
  cards_failed integer not null default 0 check (cards_failed >= 0),
  constraint review_sessions_totals_valid check (
    cards_passed + cards_failed <= cards_reviewed
  )
);

create table public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  session_id uuid null references public.review_sessions(id) on delete set null,
  reviewed_at timestamptz not null default now(),
  outcome public.review_outcome not null,
  interval_before integer not null default 0 check (interval_before >= 0),
  interval_after integer not null default 0 check (interval_after >= 0)
);

-- Bulk import tracking
create table public.import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."User"(id) on delete cascade,
  imported_at timestamptz not null default now(),
  folder_id uuid null references public.folders(id) on delete set null,
  total_cards integer not null default 0 check (total_cards >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  constraint import_counts_valid check (
    success_count + error_count <= total_cards
  )
);

-- Helpful indexes
create index idx_folders_parent_id on public.folders(parent_id);

create index idx_cards_folder_id on public.cards(folder_id);
create index idx_cards_next_review_time on public.cards(next_review_time);
create index idx_cards_user_next_review on public.cards(user_id, next_review_time);
create index idx_cards_is_flagged on public.cards(is_flagged);
create index idx_cards_repeat_interval on public.cards(repeat_interval);

create index idx_card_tags_tag_id on public.card_tags(tag_id);

create index idx_task_folders_folder_id on public.task_folders(folder_id);

create index idx_review_sessions_task_id on public.review_sessions(task_id);
create index idx_card_reviews_card_id on public.card_reviews(card_id);
create index idx_card_reviews_session_id on public.card_reviews(session_id);
create index idx_card_reviews_reviewed_at on public.card_reviews(reviewed_at);

create index idx_import_logs_folder_id on public.import_logs(folder_id);

-- User-scoped indexes for portal isolation
create index idx_folders_user_id on public.folders(user_id);
create index idx_cards_user_id on public.cards(user_id);
create index idx_tags_user_id on public.tags(user_id);
create index idx_tasks_user_id on public.tasks(user_id);
create index idx_review_sessions_user_id on public.review_sessions(user_id);
create index idx_import_logs_user_id on public.import_logs(user_id);

-- Optional: derived views (no extra models needed)
create or replace view public.folder_stats
with (security_invoker = true)
as
select
  f.id as folder_id,
  f.name as folder_name,
  count(c.id)::int as total_cards,
  count(c.id) filter (where c.repeat_interval > 21)::int as mature_cards,
  count(c.id) filter (where c.next_review_time is not null and c.next_review_time <= now())::int as due_cards,
  count(c.id) filter (where c.is_flagged = true)::int as flagged_cards
from public.folders f
left join public.cards c on c.folder_id = f.id
group by f.id, f.name;

create or replace view public.task_progress
with (security_invoker = true)
as
select
  t.id as task_id,
  t.name as task_name,
  count(distinct c.id)::int as total_cards,
  count(distinct c.id) filter (where c.next_review_time is not null and c.next_review_time <= now())::int as due_cards,
  count(cr.id)::int as total_reviews,
  count(cr.id) filter (where cr.outcome = 'pass')::int as passed_reviews,
  count(cr.id) filter (where cr.outcome = 'fail')::int as failed_reviews,
  count(cr.id) filter (where cr.outcome = 'hard')::int as hard_reviews
from public.tasks t
left join public.task_folders tf on tf.task_id = t.id
left join public.cards c on c.folder_id = tf.folder_id
left join public.card_reviews cr on cr.card_id = c.id
group by t.id, t.name;

-- ============================================================
-- Row Level Security
-- ============================================================
-- Helper: extracts the current user's bigint id from the JWT claim
-- 'app_user_id'. Your backend must include this when signing the JWT:
--   { "app_user_id": 42 }
create or replace function public.current_user_id()
returns bigint
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json->>'app_user_id',
    ''
  )::bigint;
$$;

-- Enable RLS on all user-scoped tables
alter table public.folders        enable row level security;
alter table public.cards          enable row level security;
alter table public.tags           enable row level security;
alter table public.card_tags      enable row level security;
alter table public.tasks          enable row level security;
alter table public.task_folders   enable row level security;
alter table public.user_settings  enable row level security;
alter table public.user_streaks   enable row level security;
alter table public.review_sessions enable row level security;
alter table public.card_reviews   enable row level security;
alter table public.import_logs    enable row level security;

-- Direct user-owned tables
create policy "users see own folders"
  on public.folders for all
  using (user_id = public.current_user_id());

create policy "users see own cards"
  on public.cards for all
  using (user_id = public.current_user_id());

create policy "users see own tags"
  on public.tags for all
  using (user_id = public.current_user_id());

create policy "users see own tasks"
  on public.tasks for all
  using (user_id = public.current_user_id());

create policy "users see own settings"
  on public.user_settings for all
  using (id = public.current_user_id());

create policy "users see own streaks"
  on public.user_streaks for all
  using (id = public.current_user_id());

create policy "users see own review sessions"
  on public.review_sessions for all
  using (user_id = public.current_user_id());

create policy "users see own import logs"
  on public.import_logs for all
  using (user_id = public.current_user_id());

-- Child / junction tables: scoped through parent ownership
create policy "users see own card_tags"
  on public.card_tags for all
  using (
    exists (
      select 1 from public.cards
      where cards.id = card_tags.card_id
        and cards.user_id = public.current_user_id()
    )
  );

create policy "users see own task_folders"
  on public.task_folders for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_folders.task_id
        and tasks.user_id = public.current_user_id()
    )
    and
    exists (
      select 1 from public.folders
      where folders.id = task_folders.folder_id
        and folders.user_id = public.current_user_id()
    )
  );

create policy "users see own card_reviews"
  on public.card_reviews for all
  using (
    exists (
      select 1 from public.cards
      where cards.id = card_reviews.card_id
        and cards.user_id = public.current_user_id()
    )
  );
