import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { computeStreak, todayDateStr, getCompletionsForTasks } from './tasks'

export interface DashboardData {
  dueCount: number
  currentStreak: number
  longestStreak: number
  dailyGoal: number
  reviewedToday: number
  activeTasks: ActiveTask[]
  taskCharts: TaskChart[]
}

export interface ActiveTask {
  id: string
  name: string
  due_date: string | null
  due_cards: number
}

export interface TaskChart {
  id: string
  name: string
  start_date: string         // 'YYYY-MM-DD'
  end_date: string           // 'YYYY-MM-DD' (today, or due_date if it has passed)
  completions: Set<string>   // dates marked done
  streak: number
  doneToday: boolean
}

export async function getDashboardData(): Promise<DashboardData> {
  const appUser = await getAppUser()
  const supabase = await createClient()
  const userId = appUser?.id ?? 0

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const nowIso = now.toISOString()

  const [dueRes, streakRes, settingsRes, todayRes, tasksRes] = await Promise.all([
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_time', nowIso),
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_settings')
      .select('daily_goal')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .gte('reviewed_at', startOfDay),
    supabase
      .from('tasks')
      .select('id, name, due_date, start_date, created_at')
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(8),
  ])

  // For each active task, count due cards via task_progress view
  const tasks = tasksRes.data ?? []
  let activeTasks: ActiveTask[] = tasks.map(t => ({
    id: t.id, name: t.name, due_date: t.due_date, due_cards: 0,
  }))
  let taskCharts: TaskChart[] = []

  if (tasks.length > 0) {
    const ids = tasks.map(t => t.id)
    const [progressRes, completionsByTask] = await Promise.all([
      supabase.from('task_progress').select('task_id, due_cards').in('task_id', ids),
      getCompletionsForTasks(ids),
    ])

    const byId = new Map(progressRes.data?.map(p => [p.task_id, p.due_cards]) ?? [])
    activeTasks = tasks.map(t => ({
      id: t.id, name: t.name, due_date: t.due_date, due_cards: byId.get(t.id) ?? 0,
    }))

    const today = todayDateStr()
    taskCharts = tasks.map(t => {
      const start = (t.start_date ?? t.created_at).slice(0, 10)
      // Clamp start to today if it's in the future (haven't started yet).
      const start_date = start > today ? today : start
      // End at today, or due_date if it has already passed.
      const end_date = t.due_date && t.due_date < today ? t.due_date : today
      const completions = new Set(completionsByTask.get(t.id) ?? [])
      return {
        id: t.id,
        name: t.name,
        start_date,
        end_date,
        completions,
        streak: computeStreak(Array.from(completions), today),
        doneToday: completions.has(today),
      }
    })
  }

  return {
    dueCount: dueRes.count ?? 0,
    currentStreak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    dailyGoal: settingsRes.data?.daily_goal ?? 20,
    reviewedToday: todayRes.count ?? 0,
    activeTasks,
    taskCharts,
  }
}
