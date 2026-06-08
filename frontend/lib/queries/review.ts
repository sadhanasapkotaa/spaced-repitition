import { createClient } from '@/utils/supabase/server'
import { getAllFoldersWithPath } from './folders'

export async function getDueCards(taskId?: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  if (taskId) {
    // Expand task's linked folders to include the full descendant subtree.
    const { data: folderIds, error: rpcError } = await supabase
      .rpc('get_task_folder_ids', { task_uuid: taskId })

    if (rpcError) throw rpcError

    const ids = (folderIds ?? []) as string[]

    // Empty set → no folders linked → no due cards.
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .in('folder_id', ids)
      .or(`next_review_time.lte.${now},next_review_time.is.null`)
      .order('next_review_time', { ascending: true, nullsFirst: false })

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .or(`next_review_time.lte.${now},next_review_time.is.null`)
    .order('next_review_time', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export interface FolderWithDueCards {
  id: string
  name: string
  path: string[]
  pathString: string
  dueCardCount: number
  cards: any[]
}

/**
 * Fetches all due cards and groups them by folder.
 * Returns folders sorted by:
 * 1. Number of due cards (descending)
 * 2. Alphabetically by folder name (ascending)
 */
export async function getDueCardsByFolder(): Promise<FolderWithDueCards[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Get all due cards
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .or(`next_review_time.lte.${now},next_review_time.is.null`)
    .order('next_review_time', { ascending: true, nullsFirst: false })

  if (cardsError) throw cardsError

  // Get all folders with their paths
  const folders = await getAllFoldersWithPath()

  // Group cards by folder_id and count due cards per folder
  const cardsByFolder = new Map<string, any[]>()
  const folderWithCards = new Set<string>()

  for (const card of cards ?? []) {
    if (card.folder_id) {
      if (!cardsByFolder.has(card.folder_id)) {
        cardsByFolder.set(card.folder_id, [])
      }
      cardsByFolder.get(card.folder_id)!.push(card)
      folderWithCards.add(card.folder_id)
    }
  }

  // Build result with only folders that have due cards
  const result: FolderWithDueCards[] = []

  for (const folder of folders) {
    const dueCards = cardsByFolder.get(folder.id) ?? []
    if (dueCards.length > 0) {
      result.push({
        id: folder.id,
        name: folder.name,
        path: folder.path,
        pathString: folder.path.join('/'),
        dueCardCount: dueCards.length,
        cards: dueCards,
      })
    }
  }

  // Sort by:
  // 1. Due card count (descending)
  // 2. Folder name (ascending/alphabetically)
  result.sort((a, b) => {
    if (b.dueCardCount !== a.dueCardCount) {
      return b.dueCardCount - a.dueCardCount
    }
    return a.name.localeCompare(b.name)
  })

  return result
}

export async function getSession(sessionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (error) throw error
  return data
}
