import { createClient } from '@/utils/supabase/server'
import type { TaskRow } from '@/types/database'

export interface TaskWithStreak {
  task: TaskRow
  completions: string[]          // dates as 'YYYY-MM-DD' (server local)
  streak: number                 // consecutive days ending today (or yesterday if today not yet done)
  doneToday: boolean
}

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

// All completion dates for one task, ordered ascending.
export async function getTaskCompletions(taskId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_completions')
    .select('completed_on')
    .eq('task_id', taskId)
    .order('completed_on', { ascending: true })
  if (error) throw error
  return (data ?? []).map(r => r.completed_on)
}

// Bulk: completions for many tasks, grouped by task_id.
export async function getCompletionsForTasks(
  taskIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>()
  if (taskIds.length === 0) return out
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_completions')
    .select('task_id, completed_on')
    .in('task_id', taskIds)
    .order('completed_on', { ascending: true })
  if (error) throw error
  for (const row of data ?? []) {
    const arr = out.get(row.task_id) ?? []
    arr.push(row.completed_on)
    out.set(row.task_id, arr)
  }
  return out
}

// Today as 'YYYY-MM-DD' (UTC — matches what we use as RLS reference).
export function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Consecutive completed days ending today (or yesterday if today is not yet
// done — a fresh morning shouldn't break yesterday's streak).
export function computeStreak(completions: string[], today = todayDateStr()): number {
  if (completions.length === 0) return 0
  const set = new Set(completions)
  const yesterday = addDays(today, -1)
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null
  if (!cursor) return 0
  let streak = 0
  while (set.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
