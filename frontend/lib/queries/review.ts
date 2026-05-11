import { createClient } from '@/utils/supabase/server'

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
