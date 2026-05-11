import { createClient } from '@/utils/supabase/server'

export async function getFolders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFolder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export interface FolderWithPath {
  id: string
  name: string
  parent_id: string | null
  /** Names from root → this folder, e.g. ['Spanish', 'Verbs', 'Past Tense']. */
  path: string[]
  /** Depth in the tree, where root folders are 0. */
  depth: number
}

/**
 * Returns every folder the user owns, each annotated with its full ancestor
 * path. Use this when you need a flat list that still conveys hierarchy —
 * e.g. picker UIs where a user selects from anywhere in the tree.
 *
 * Result is sorted in tree-traversal order (parents before children),
 * with siblings alphabetized.
 */
export async function getAllFoldersWithPath(): Promise<FolderWithPath[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .order('name', { ascending: true })
  if (error) throw error

  const folders = data ?? []
  const byId = new Map(folders.map(f => [f.id, f]))
  const childrenOf = new Map<string | null, typeof folders>()
  for (const f of folders) {
    const key = f.parent_id
    if (!childrenOf.has(key)) childrenOf.set(key, [])
    childrenOf.get(key)!.push(f)
  }

  const result: FolderWithPath[] = []

  function walk(parentId: string | null, ancestors: string[]) {
    const kids = childrenOf.get(parentId) ?? []
    for (const f of kids) {
      const path = [...ancestors, f.name]
      result.push({
        id: f.id,
        name: f.name,
        parent_id: f.parent_id,
        path,
        depth: ancestors.length,
      })
      walk(f.id, path)
    }
  }

  walk(null, [])

  // Anything left (orphaned by a missing parent — shouldn't normally happen
  // since parent_id IS set null on delete, but handle defensively).
  const seen = new Set(result.map(r => r.id))
  for (const f of folders) {
    if (seen.has(f.id)) continue
    result.push({
      id: f.id,
      name: f.name,
      parent_id: f.parent_id,
      path: [f.name],
      depth: 0,
    })
  }

  return result
}

export async function getSubfolders(parentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('parent_id', parentId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Walks the parent chain for the given folder and returns ancestors
 * from root → immediate parent (excludes the folder itself).
 * Caps at 8 levels to defend against accidental cycles.
 */
async function fetchFolderById(
  id: string,
): Promise<{ id: string; name: string; parent_id: string | null } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function getFolderAncestors(folderId: string) {
  const chain: { id: string; name: string }[] = []
  let currentId: string | null = folderId
  let safety = 8

  while (currentId && safety-- > 0) {
    const row = await fetchFolderById(currentId)
    if (!row) break

    if (row.id !== folderId) {
      chain.unshift({ id: row.id, name: row.name })
    }
    currentId = row.parent_id
  }

  return chain
}

export async function getFolderStats(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folder_stats')
    .select('*')
    .eq('folder_id', id)
    .single()
  if (error) throw error
  return data
}
