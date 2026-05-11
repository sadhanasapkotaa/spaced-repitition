'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'

function revalidateFolderViews(parentId?: string | null) {
  revalidatePath('/library')
  if (parentId) revalidatePath(`/library/${parentId}`)
}

export async function createFolder(name: string, parentId?: string) {
  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('folders')
    .insert({ user_id: appUser.id, name, parent_id: parentId ?? null })
  if (error) throw error

  revalidateFolderViews(parentId)
}

export async function updateFolder(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('folders')
    .update({ name })
    .eq('id', id)
    .select('parent_id')
    .single()
  if (error) throw error

  revalidateFolderViews(data?.parent_id ?? null)
  revalidatePath(`/library/${id}`)
}

export async function deleteFolder(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Read parent before delete so we can revalidate its page.
  const { data: existing } = await supabase
    .from('folders')
    .select('parent_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
  if (error) throw error

  revalidateFolderViews(existing?.parent_id ?? null)
}
