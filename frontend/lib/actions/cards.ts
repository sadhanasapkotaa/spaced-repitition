'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type CardUpdate = Database['public']['Tables']['cards']['Update']

interface CardPayload {
  folder_id: string | null
  front: string
  back: string
  hint?: string | null
  color?: string | null
  tag_ids?: string[]
}

function revalidateCardViews(folderId: string | null) {
  revalidatePath('/library')
  revalidatePath('/library/orphaned')
  revalidatePath('/library/flagged')
  revalidatePath('/tags')
  if (folderId) revalidatePath(`/library/${folderId}`)
}

export async function createCard(payload: CardPayload) {
  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .insert({
      user_id: appUser.id,
      folder_id: payload.folder_id,
      front: payload.front,
      back: payload.back,
      hint: payload.hint ?? null,
      color: payload.color ?? null,
    })
    .select('id')
    .single()
  if (error) throw error

  if (payload.tag_ids && payload.tag_ids.length > 0) {
    const rows = payload.tag_ids.map(tag_id => ({ card_id: data.id, tag_id }))
    const { error: tagErr } = await supabase.from('card_tags').insert(rows)
    if (tagErr) throw tagErr
  }

  revalidateCardViews(payload.folder_id)
}

export async function updateCard(
  id: string,
  folderId: string | null,
  payload: Partial<Omit<CardPayload, 'folder_id'>> & { is_flagged?: boolean; folder_id?: string | null },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const updates: CardUpdate = {}
  if (payload.front !== undefined) updates.front = payload.front
  if (payload.back !== undefined)  updates.back = payload.back
  if (payload.hint !== undefined)  updates.hint = payload.hint || null
  if (payload.color !== undefined) updates.color = payload.color || null
  if (payload.is_flagged !== undefined) updates.is_flagged = payload.is_flagged
  if (payload.folder_id !== undefined)  updates.folder_id = payload.folder_id

  const { error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
  if (error) throw error

  revalidateCardViews(folderId)
  if (payload.folder_id !== undefined && payload.folder_id !== folderId) {
    revalidateCardViews(payload.folder_id ?? null)
  }
}

export async function deleteCard(id: string, folderId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
  if (error) throw error

  revalidateCardViews(folderId)
}

export async function flagCard(id: string, folderId: string | null, flagged: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('cards')
    .update({ is_flagged: flagged })
    .eq('id', id)
  if (error) throw error

  revalidateCardViews(folderId)
}
