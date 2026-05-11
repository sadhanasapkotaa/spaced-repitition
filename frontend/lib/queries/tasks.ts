import { createClient } from '@/utils/supabase/server'

export async function getTasks() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getTask(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getTaskProgress(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_progress')
    .select('*')
    .eq('task_id', id)
    .single()
  if (error) return null
  return data
}

export async function getTaskFolders(taskId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_folders')
    .select(`
      folder_id,
      folders ( id, name )
    `)
    .eq('task_id', taskId)
  if (error) throw error
  return data
}
