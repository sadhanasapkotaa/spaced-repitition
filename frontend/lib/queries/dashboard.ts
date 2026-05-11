import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'

export interface DashboardData {
  dueCount: number
  currentStreak: number
  longestStreak: number
  dailyGoal: number
  reviewedToday: number
  activeTasks: ActiveTask[]
}

export interface ActiveTask {
  id: string
  name: string
  due_date: string | null
  due_cards: number
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
      .select('id, name, due_date')
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(8),
  ])

  // For each active task, count due cards via task_progress view
  const tasks = tasksRes.data ?? []
  let activeTasks: ActiveTask[] = tasks.map(t => ({ ...t, due_cards: 0 }))

  if (tasks.length > 0) {
    const { data: progressRows } = await supabase
      .from('task_progress')
      .select('task_id, due_cards')
      .in('task_id', tasks.map(t => t.id))

    const byId = new Map(progressRows?.map(p => [p.task_id, p.due_cards]) ?? [])
    activeTasks = tasks.map(t => ({ ...t, due_cards: byId.get(t.id) ?? 0 }))
  }

  return {
    dueCount: dueRes.count ?? 0,
    currentStreak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    dailyGoal: settingsRes.data?.daily_goal ?? 20,
    reviewedToday: todayRes.count ?? 0,
    activeTasks,
  }
}
