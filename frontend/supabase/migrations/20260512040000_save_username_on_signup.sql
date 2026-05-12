-- Persist username on signup.
--
-- The register form sends `username` in supabase.auth.signUp's options.data,
-- which Supabase stores on auth.users.raw_user_meta_data. The previous
-- versions of handle_new_auth_user() and ensure_app_user() only copied
-- email into public."User", so the username column stayed NULL.
--
-- This migration updates both paths to also read username from
-- raw_user_meta_data / auth.jwt() user_metadata.

-- 1. Trigger: also copy username from raw_user_meta_data
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."User" (email, username)
  values (
    new.email,
    nullif(new.raw_user_meta_data->>'username', '')
  )
  on conflict do nothing;
  return new;
end;
$$;

-- 2. Backfill helper: same change on the find-or-create path
create or replace function public.ensure_app_user()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_email text;
  jwt_username text;
  result_row public."User";
begin
  jwt_email := auth.jwt() ->> 'email';
  if jwt_email is null then
    return null;
  end if;

  jwt_username := nullif(auth.jwt() #>> '{user_metadata,username}', '');

  select * into result_row
  from public."User"
  where email = jwt_email
  limit 1;

  if found then
    -- Late-arriving username (existing row from before this migration)
    if result_row.username is null and jwt_username is not null then
      update public."User"
         set username = jwt_username
       where id = result_row.id
       returning * into result_row;
    end if;
    return to_jsonb(result_row);
  end if;

  begin
    insert into public."User" (email, username)
    values (jwt_email, jwt_username)
    returning * into result_row;
  exception when unique_violation then
    select * into result_row
    from public."User"
    where email = jwt_email
    limit 1;
  end;

  return to_jsonb(result_row);
end;
$$;

revoke execute on function public.ensure_app_user() from public;
grant  execute on function public.ensure_app_user() to authenticated;

notify pgrst, 'reload schema';
