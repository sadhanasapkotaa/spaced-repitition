import { createClient } from '@/utils/supabase/server'

export async function getCardsByFolder(folderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag_id,
        tags ( id, name )
      )
    `)
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrphanedCards() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag_id,
        tags ( id, name )
      )
    `)
    .is('folder_id', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFlaggedCards() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      folders ( id, name ),
      card_tags (
        tag_id,
        tags ( id, name )
      )
    `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCard(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag_id,
        tags ( id, name )
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
