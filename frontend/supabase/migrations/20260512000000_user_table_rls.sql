-- RLS policies for public."User"
--
-- The User table is referenced as the bigint join key by every user-scoped
-- table. The DB trigger handle_new_auth_user normally seeds a row at signup,
-- but if it didn't run (e.g. users predate the trigger) the app needs to be
-- able to backfill the row from the server action layer.
--
-- These policies key off the JWT email claim, NOT app_user_id, because the
-- whole point is to bootstrap the row that defines app_user_id.

alter table public."User" enable row level security;

drop policy if exists "users see own User row"   on public."User";
drop policy if exists "users create own User row" on public."User";
drop policy if exists "users update own User row" on public."User";

create policy "users see own User row"
  on public."User" for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

create policy "users create own User row"
  on public."User" for insert
  to authenticated
  with check (email = (auth.jwt() ->> 'email'));

create policy "users update own User row"
  on public."User" for update
  to authenticated
  using       (email = (auth.jwt() ->> 'email'))
  with check  (email = (auth.jwt() ->> 'email'));

-- The trigger and JWT hook are security definer, so they already bypass RLS
-- and don't need explicit grants.
