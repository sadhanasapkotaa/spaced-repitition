import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRow } from '@/types/database'

/**
 * Returns the currently authenticated Supabase auth user, or null.
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Returns the authenticated user or redirects to /login.
 * Use in Server Components / Route Handlers that must be protected.
 */
export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Returns the row from public."User" matching the auth session, creating it
 * if needed. Delegates to the SECURITY DEFINER `ensure_app_user` function so
 * RLS on the User table doesn't block backfill.
 */
export async function getAppUser(): Promise<UserRow | null> {
  const supabase = await createClient()
  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser.user?.email) return null

  const { data, error } = await supabase.rpc('ensure_app_user')

  if (error) {
    console.error('[getAppUser] ensure_app_user RPC failed:', error.message)
    return null
  }
  return data as UserRow | null
}
