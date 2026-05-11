import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function ReviewPage() {
  const supabase = await createClient()
  const today = new Date().toISOString()

  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .lte('next_review_time', today)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Review</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">{count ?? 0}</p>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">cards due</p>

        {(count ?? 0) > 0 ? (
          <Link
            href="/review/session"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Start review
          </Link>
        ) : (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            All caught up! Check back later.
          </p>
        )}
      </div>
    </div>
  )
}
