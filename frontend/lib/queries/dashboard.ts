import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { todayDateStr, getCompletionsForTasks } from './tasks'

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
  doneDays: number
  totalDays: number
}

// Per-task summary for the dashboard chart: total days the task has been
// active vs. how many of those days were checked off. The bar collapses
// these to a single done/missed ratio.
export interface TaskChart {
  id: string
  name: string
  doneDays: number
  totalDays: number
  doneToday: boolean
}

function addUtcDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string): number {
  if (start > end) return 0
  const a = new Date(start + 'T00:00:00Z').getTime()
  const b = new Date(end   + 'T00:00:00Z').getTime()
  return Math.round((b - a) / 86_400_000) + 1
}

// Daily streak across *all* tasks: a day counts only when every task that
// was active that day was checked off. Days with no active tasks are
// skipped (neutral — can't fail when there's nothing to do).
interface TaskWindow {
  id: string
  start: string                     // 'YYYY-MM-DD' inclusive
  end: string | null                // due_date inclusive, null = open-ended
  completions: Set<string>
}

function evaluateDay(day: string, windows: TaskWindow[]): 'done' | 'missed' | 'inactive' {
  let active = 0
  for (const w of windows) {
    if (day < w.start) continue
    if (w.end && day > w.end) continue
    active++
    if (!w.completions.has(day)) return 'missed'
  }
  return active === 0 ? 'inactive' : 'done'
}

function computeAllTasksDailyStreak(
  windows: TaskWindow[],
  today: string,
): { current: number; longest: number } {
  if (windows.length === 0) return { current: 0, longest: 0 }

  const earliest = windows.reduce((m, w) => w.start < m ? w.start : m, windows[0].start)

  // Current streak: walk back from today; allow today to be "not done yet"
  // by falling through to yesterday once, so a fresh morning doesn't reset it.
  let current = 0
  {
    let cursor = today
    let allowedSkip = true
    while (cursor >= earliest) {
      const r = evaluateDay(cursor, windows)
      if (r === 'done') { current++; allowedSkip = false }
      else if (r === 'missed') {
        if (allowedSkip && cursor === today) { allowedSkip = false }
        else break
      }
      // 'inactive': skip silently
      cursor = addUtcDays(cursor, -1)
    }
  }

  // Longest: scan full range.
  let longest = 0
  let run = 0
  for (let day = earliest; day <= today; day = addUtcDays(day, 1)) {
    const r = evaluateDay(day, windows)
    if (r === 'done') { run++; if (run > longest) longest = run }
    else if (r === 'missed') run = 0
    // 'inactive': neither break nor count
  }

  return { current, longest }
}

export async function getDashboardData(): Promise<DashboardData> {
  const appUser = await getAppUser()
  const supabase = await createClient()
  const userId = appUser?.id ?? 0

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const nowIso = now.toISOString()

  const [dueRes, settingsRes, todayRes, tasksRes] = await Promise.all([
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_time', nowIso),
    supabase
      .from('user_settings')
      .select('daily_goal')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .gte('reviewed_at', startOfDay),
    // Load *all* tasks (no limit) — the daily streak rule requires every
    // active task to be checked off, so we cannot evaluate it from a slice.
    // The dashboard's "Active tasks" list still trims to a few below.
    supabase
      .from('tasks')
      .select('id, name, due_date, start_date, created_at')
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false }),
  ])

  const tasks = tasksRes.data ?? []
  const today = todayDateStr()
  let activeTasks: ActiveTask[] = []
  let taskCharts: TaskChart[] = []
  let currentStreak = 0
  let longestStreak = 0

  if (tasks.length > 0) {
    const ids = tasks.map(t => t.id)
    const [progressRes, completionsByTask] = await Promise.all([
      supabase.from('task_progress').select('task_id, due_cards').in('task_id', ids),
      getCompletionsForTasks(ids),
    ])

    const byId = new Map(progressRes.data?.map(p => [p.task_id, p.due_cards]) ?? [])

    // Build per-task windows. `start` is the *actual* start date (no clamping
    // to today). A future-start task is therefore 'inactive' today — it
    // cannot drop the all-tasks-done streak just because the user hasn't
    // (and shouldn't have) checked it off yet.
    const windows: TaskWindow[] = tasks.map(t => ({
      id: t.id,
      start: (t.start_date ?? t.created_at).slice(0, 10),
      end: t.due_date,
      completions: new Set(completionsByTask.get(t.id) ?? []),
    }))
    const windowById = new Map(windows.map(w => [w.id, w]))

    // For each task, count done/total days within its active window
    // intersected with [start, today/due_date]. Future-start tasks naturally
    // get totalDays = 0 here (start > end), which the bar renders as an
    // empty rail.
    const ratioFor = (id: string): { doneDays: number; totalDays: number } => {
      const w = windowById.get(id)!
      const end = w.end && w.end < today ? w.end : today
      const totalDays = daysBetween(w.start, end)
      let doneDays = 0
      for (const c of w.completions) if (c >= w.start && c <= end) doneDays++
      return { doneDays, totalDays }
    }

    // Display the next 8 by due date; streak math below uses the full set.
    activeTasks = tasks.slice(0, 8).map(t => {
      const { doneDays, totalDays } = ratioFor(t.id)
      return {
        id: t.id,
        name: t.name,
        due_date: t.due_date,
        due_cards: byId.get(t.id) ?? 0,
        doneDays,
        totalDays,
      }
    })

    // Per-task chart summary (full set, not just the top 8).
    taskCharts = tasks.map(t => {
      const { doneDays, totalDays } = ratioFor(t.id)
      const w = windowById.get(t.id)!
      return {
        id: t.id,
        name: t.name,
        doneDays,
        totalDays,
        doneToday: w.completions.has(today),
      }
    })

    const streaks = computeAllTasksDailyStreak(windows, today)
    currentStreak = streaks.current
    longestStreak = streaks.longest
  }

  return {
    dueCount: dueRes.count ?? 0,
    currentStreak,
    longestStreak,
    dailyGoal: settingsRes.data?.daily_goal ?? 20,
    reviewedToday: todayRes.count ?? 0,
    activeTasks,
    taskCharts,
  }
}
