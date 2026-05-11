'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'

export async function createTag(name: string): Promise<{ id: string; name: string }> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Tag name required.')
  if (trimmed.length > 40) throw new Error('Tag name too long.')

  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: appUser.id, name: trimmed })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('A tag with that name already exists.')
    throw error
  }

  revalidatePath('/tags')
  return data
}

export async function deleteTag(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
  if (error) throw error

  revalidatePath('/tags')
  revalidatePath('/library')
}

export async function renameTag(id: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Tag name required.')
  if (trimmed.length > 40) throw new Error('Tag name too long.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tags')
    .update({ name: trimmed })
    .eq('id', id)
  if (error) {
    if (error.code === '23505') throw new Error('A tag with that name already exists.')
    throw error
  }

  revalidatePath('/tags')
  revalidatePath('/library')
}

export async function setCardTags(cardId: string, tagIds: string[], folderId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Replace existing tag set
  const { error: delErr } = await supabase
    .from('card_tags')
    .delete()
    .eq('card_id', cardId)
  if (delErr) throw delErr

  if (tagIds.length > 0) {
    const rows = tagIds.map(tag_id => ({ card_id: cardId, tag_id }))
    const { error: insErr } = await supabase
      .from('card_tags')
      .insert(rows)
    if (insErr) throw insErr
  }

  revalidatePath('/tags')
  revalidatePath('/library')
  revalidatePath('/library/orphaned')
  revalidatePath('/library/flagged')
  if (folderId) revalidatePath(`/library/${folderId}`)
}
