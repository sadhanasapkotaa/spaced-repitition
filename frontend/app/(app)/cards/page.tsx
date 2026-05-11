import { createClient } from '@/utils/supabase/server'
import type { CardRow } from '@/types/database'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Cards</h1>
      {!cards?.length ? (
        <p className="text-zinc-500 dark:text-zinc-400">No cards yet.</p>
      ) : (
        <ul className="space-y-2">
          {cards.map((card: CardRow) => (
            <li
              key={card.id}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{card.front}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.back}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
