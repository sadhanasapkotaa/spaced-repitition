import { getAppUser } from '@/utils/supabase/auth'
import { createClient } from '@/utils/supabase/server'

export default async function SettingsPage() {
  const [appUser, supabase] = await Promise.all([
    getAppUser(),
    createClient(),
  ])

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', appUser?.id ?? 0)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</p>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">{appUser?.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</p>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">{appUser?.username ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily goal</p>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">
            {settings?.daily_goal ?? 20} cards/day
          </p>
        </div>
      </div>
    </div>
  )
}
