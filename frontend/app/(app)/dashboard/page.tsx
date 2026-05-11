import { getAppUser } from '@/utils/supabase/auth'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const [appUser, supabase] = await Promise.all([
    getAppUser(),
    createClient(),
  ])

  const today = new Date().toISOString()

  const [{ count: dueCount }, { data: streak }, { data: settings }] = await Promise.all([
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_time', today),
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_reviewed_date')
      .eq('id', appUser?.id ?? 0)
      .maybeSingle(),
    supabase
      .from('user_settings')
      .select('daily_goal')
      .eq('id', appUser?.id ?? 0)
      .maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Welcome back{appUser?.username ? `, ${appUser.username}` : ''}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cards due" value={dueCount ?? 0} />
        <StatCard label="Current streak" value={`${streak?.current_streak ?? 0} days`} />
        <StatCard label="Daily goal" value={settings?.daily_goal ?? 20} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  )
}
