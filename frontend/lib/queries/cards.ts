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

/**
 * Returns all cards belonging to a folder or any of its descendants.
 * Walks the folder tree in JS — keeps things in one query for folders
 * and one for cards, no migration needed.
 */
export async function getCardsInFolderTree(folderId: string) {
  const supabase = await createClient()

  const { data: folders, error: folderErr } = await supabase
    .from('folders')
    .select('id, parent_id')
  if (folderErr) throw folderErr

  const childrenOf = new Map<string, string[]>()
  for (const f of folders ?? []) {
    if (!f.parent_id) continue
    if (!childrenOf.has(f.parent_id)) childrenOf.set(f.parent_id, [])
    childrenOf.get(f.parent_id)!.push(f.id)
  }

  const ids = new Set<string>([folderId])
  const queue = [folderId]
  while (queue.length > 0) {
    const id = queue.shift()!
    for (const child of childrenOf.get(id) ?? []) {
      if (!ids.has(child)) {
        ids.add(child)
        queue.push(child)
      }
    }
  }

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
    .in('folder_id', Array.from(ids))
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
