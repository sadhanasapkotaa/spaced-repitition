import { createClient } from '@/utils/supabase/server'
import type { ReviewOutcome } from '@/types/database'

export interface DailyReview {
  date: string  // YYYY-MM-DD
  pass: number
  hard: number
  fail: number
  total: number
}

export interface FolderMaturity {
  folder_id: string
  folder_name: string
  total_cards: number
  mature_cards: number
  due_cards: number
  flagged_cards: number
}

export interface StatsData {
  folderMaturity: FolderMaturity[]
  dailyReviews: DailyReview[]
  totals: {
    cards: number
    mature: number
    reviews30d: number
    passRate30d: number  // 0..1
  }
}

export async function getStatsData(): Promise<StatsData> {
  const supabase = await createClient()

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - 29)
  const startIso = start.toISOString()

  const [folderStatsRes, reviewsRes, cardsCountRes] = await Promise.all([
    supabase
      .from('folder_stats')
      .select('*'),
    supabase
      .from('card_reviews')
      .select('reviewed_at, outcome')
      .gte('reviewed_at', startIso)
      .order('reviewed_at', { ascending: true }),
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true }),
  ])

  const folderMaturity: FolderMaturity[] = folderStatsRes.data ?? []
  const reviewRows = (reviewsRes.data ?? []) as { reviewed_at: string; outcome: ReviewOutcome }[]

  // Bucket reviews by day (local time)
  const byDay = new Map<string, DailyReview>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = ymd(d)
    byDay.set(key, { date: key, pass: 0, hard: 0, fail: 0, total: 0 })
  }

  for (const r of reviewRows) {
    const key = ymd(new Date(r.reviewed_at))
    const bucket = byDay.get(key)
    if (!bucket) continue
    bucket[r.outcome]++
    bucket.total++
  }

  const dailyReviews = Array.from(byDay.values())

  const totalReviews30d = dailyReviews.reduce((sum, d) => sum + d.total, 0)
  const passReviews30d = dailyReviews.reduce((sum, d) => sum + d.pass, 0)
  const passRate30d = totalReviews30d > 0 ? passReviews30d / totalReviews30d : 0

  const totalCards = cardsCountRes.count ?? 0
  const matureCards = folderMaturity.reduce((sum, f) => sum + f.mature_cards, 0)

  return {
    folderMaturity,
    dailyReviews,
    totals: {
      cards: totalCards,
      mature: matureCards,
      reviews30d: totalReviews30d,
      passRate30d,
    },
  }
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
