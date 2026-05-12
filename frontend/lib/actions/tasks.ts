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

// Mark a task as done for *today*. Past days are immutable — the server
// (via Postgres default + RLS) only ever writes `completed_on = current_date`.
// Passing `done=false` clears today's row only; yesterday's missed day stays
// missed forever.
export async function setTaskDoneToday(id: string, done: boolean) {
  const supabase = await createClient()

  if (done) {
    // completed_on defaults to current_date in Postgres; RLS rejects any
    // other value, so the client cannot backfill missed days.
    const { error } = await supabase
      .from('task_completions')
      .upsert({ task_id: id }, { onConflict: 'task_id,completed_on' })
    if (error) throw error
  } else {
    const todayUtc = new Date().toISOString().slice(0, 10)
    const { error } = await supabase
      .from('task_completions')
      .delete()
      .eq('task_id', id)
      .eq('completed_on', todayUtc)
    if (error) throw error
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
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
