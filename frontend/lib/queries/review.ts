import { createClient } from '@/utils/supabase/server'

export async function getDueCards(taskId?: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  if (taskId) {
    // Fetch folder IDs linked to this task, then filter cards
    const { data: taskFolders } = await supabase
      .from('task_folders')
      .select('folder_id')
      .eq('task_id', taskId)

    const folderIds = taskFolders?.map(tf => tf.folder_id) ?? []

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .in('folder_id', folderIds.length ? folderIds : [''])
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
