'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'

interface TaskPayload {
  name: string
  start_date?: string
  due_date?: string
}

export async function createTask(payload: TaskPayload) {
  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id:    appUser.id,
      name:       payload.name,
      start_date: payload.start_date ?? null,
      due_date:   payload.due_date   ?? null,
    })
    .select('id')
    .single()
  if (error) throw error

  revalidatePath('/tasks')
  return data.id
}

export async function updateTask(id: string, payload: Partial<TaskPayload>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
  if (error) throw error

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
}

export async function setTaskCompleted(id: string, completed: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: completed })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  if (error) throw error

  revalidatePath('/tasks')
}

export async function assignFoldersToTask(taskId: string, folderIds: string[]) {
  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('task_folders')
    .delete()
    .eq('task_id', taskId)
  if (deleteError) throw deleteError

  if (folderIds.length > 0) {
    const rows = folderIds.map(folder_id => ({ task_id: taskId, folder_id }))
    const { error: insertError } = await supabase
      .from('task_folders')
      .insert(rows)
    if (insertError) throw insertError
  }

  revalidatePath(`/tasks/${taskId}`)
}
