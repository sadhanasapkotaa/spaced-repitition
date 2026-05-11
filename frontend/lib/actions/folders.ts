'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'

export async function createFolder(name: string, parentId?: string) {
  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('folders')
    .insert({ user_id: appUser.id, name, parent_id: parentId ?? null })
  if (error) throw error

  revalidatePath('/library')
}

export async function updateFolder(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('folders')
    .update({ name })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/library')
}

export async function deleteFolder(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
  if (error) throw error

  revalidatePath('/library')
}
