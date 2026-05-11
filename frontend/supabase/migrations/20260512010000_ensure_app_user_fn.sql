-- SECURITY DEFINER backfill for public."User".
--
-- The User table has RLS enabled but no policies that match the
-- current auth context, which means server actions can't read or
-- create the row directly. This function runs as the function owner
-- and bypasses RLS, so it can always find-or-create the User row
-- for the calling auth user.
--
-- It keys off the JWT 'email' claim, which is always present for
-- authenticated sessions.

-- Drop both signatures in case the previous version exists with a
-- different return type — that prevents create-or-replace from working.
drop function if exists public.ensure_app_user();

create function public.ensure_app_user()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_email text;
  result_row public."User";
begin
  jwt_email := auth.jwt() ->> 'email';
  if jwt_email is null then
    return null;
  end if;

  -- Already exists?
  select * into result_row
  from public."User"
  where email = jwt_email
  limit 1;

  if found then
    return to_jsonb(result_row);
  end if;

  -- Otherwise create it. Handle the rare concurrent-call race.
  begin
    insert into public."User" (email)
    values (jwt_email)
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

-- Force PostgREST to refresh its schema cache so the new function is
-- visible to the API immediately, not on next auto-reload.
notify pgrst, 'reload schema';
