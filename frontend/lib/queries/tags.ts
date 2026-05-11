import { createClient } from '@/utils/supabase/server'

export interface TagWithCount {
  id: string
  name: string
  card_count: number
}

export async function getTags(): Promise<TagWithCount[]> {
  const supabase = await createClient()

  // Fetch tags + card_tags relations so we can count client-side.
  // Counting via a postgres view would be cleaner, but this avoids
  // a new migration for now.
  const { data, error } = await supabase
    .from('tags')
    .select(`
      id,
      name,
      card_tags ( card_id )
    `)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map(t => ({
    id: t.id,
    name: t.name,
    card_count: t.card_tags?.length ?? 0,
  }))
}

export async function getCardTagIds(cardId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('card_tags')
    .select('tag_id')
    .eq('card_id', cardId)
  if (error) throw error
  return (data ?? []).map(r => r.tag_id)
}
