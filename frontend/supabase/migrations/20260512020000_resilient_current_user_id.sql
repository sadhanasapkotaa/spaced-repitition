-- Make current_user_id() resilient.
--
-- The original definition relied solely on the JWT 'app_user_id' claim,
-- which is only populated by custom_access_token_hook. If the hook isn't
-- registered in the Supabase dashboard, OR if the user's current session
-- predates their public."User" row, the claim is null and every RLS check
-- on user-scoped tables fails.
--
-- This version COALESCEs to an email-based User lookup when the JWT claim
-- is absent, so the system works regardless of hook configuration. The
-- fast path (JWT claim present) has no overhead — the subquery only
-- executes when the claim is null.
--
-- SECURITY DEFINER lets the function read public."User" even when RLS on
-- that table would otherwise block the calling user.

create or replace function public.current_user_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(
      current_setting('request.jwt.claims', true)::jsonb ->> 'app_user_id',
      ''
    )::bigint,
    (
      select id
      from public."User"
      where email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
      limit 1
    )
  );
$$;

-- Force PostgREST to refresh its schema cache so RLS picks up the new
-- function definition immediately.
notify pgrst, 'reload schema';
