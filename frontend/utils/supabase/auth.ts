import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
 * Returns the row from public."User" matching the auth session,
 * using the email as the join key (populated by the DB trigger).
 */
export async function getAppUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('email', user.email)
    .single()

  if (error) return null
  return data
}
