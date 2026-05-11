-- Auth integration: trigger + JWT hook
-- Run after the main schema migration.

-- ============================================================
-- 1. Trigger: create a public."User" row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer          -- runs as the function owner, not the caller
set search_path = public  -- prevents search_path injection
as $$
begin
  insert into public."User" (email)
  values (new.email)
  on conflict do nothing;  -- idempotent: no-op if already exists
  return new;
end;
$$;

-- Drop first so re-running the migration is safe
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ============================================================
-- 2. JWT hook: inject app_user_id into the Supabase JWT
--
-- Register this in the Supabase dashboard:
--   Authentication → Hooks → Customize Access Token (JWT) Hook
--   → Select function: public.custom_access_token_hook
-- ============================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  app_user_id bigint;
  claims jsonb;
begin
  -- Look up the matching public."User" by email from the auth event
  select id into app_user_id
  from public."User"
  where email = (event->>'email');

  -- Merge app_user_id into the existing claims object
  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_user_id}', to_jsonb(app_user_id));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Grant execute to the roles Supabase uses for hooks
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
