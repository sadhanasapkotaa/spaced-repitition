'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { calculateNextReview, updateStreak } from '@/utils/sr-algorithm'
import type { ReviewOutcome } from '@/utils/sr-algorithm'
import { revalidatePath } from 'next/cache'

export async function startSession(taskId?: string): Promise<string> {
  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('review_sessions')
    .insert({
      user_id: appUser.id,
      task_id: taskId ?? null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

interface CardState {
  difficulty: number
  repeat_interval: number
  review_count: number
}

export async function gradeCard(
  cardId: string,
  sessionId: string,
  outcome: ReviewOutcome,
  cardState: CardState,
) {
  const supabase = await createClient()
  const now = new Date()
  const result = calculateNextReview(cardState, outcome, now)

  const [cardUpdate, reviewInsert] = await Promise.all([
    supabase
      .from('cards')
      .update({
        difficulty: result.difficulty,
        repeat_interval: result.repeat_interval,
        review_count: result.review_count,
        last_review_time: result.last_review_time.toISOString(),
        next_review_time: result.next_review_time.toISOString(),
      })
      .eq('id', cardId),
    supabase
      .from('card_reviews')
      .insert({
        card_id: cardId,
        session_id: sessionId,
        outcome,
        interval_before: cardState.repeat_interval,
        interval_after: result.repeat_interval,
      }),
  ])

  if (cardUpdate.error) throw cardUpdate.error
  if (reviewInsert.error) throw reviewInsert.error
}

export async function endSession(sessionId: string) {
  const supabase = await createClient()

  // Fetch outcome counts in parallel
  const [allReviews, passedReviews, failedReviews] = await Promise.all([
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId),
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('outcome', 'pass'),
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('outcome', 'fail'),
  ])

  const reviewed = allReviews.count ?? 0
  const passed   = passedReviews.count ?? 0
  const failed   = failedReviews.count ?? 0

  await supabase
    .from('review_sessions')
    .update({
      ended_at: new Date().toISOString(),
      cards_reviewed: reviewed,
      cards_passed: passed,
      cards_failed: failed,
    })
    .eq('id', sessionId)

  // Update streak
  const appUser = await getAppUser()
  if (appUser) {
    const { data: streakRow } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('id', appUser.id)
      .single()

    if (streakRow) {
      const newStreak = updateStreak(
        {
          current_streak: streakRow.current_streak,
          longest_streak: streakRow.longest_streak,
          last_reviewed_date: streakRow.last_reviewed_date
            ? new Date(streakRow.last_reviewed_date)
            : null,
        },
        new Date(),
      )
      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak.current_streak,
          longest_streak: newStreak.longest_streak,
          last_reviewed_date: newStreak.last_reviewed_date.toISOString(),
        })
        .eq('id', appUser.id)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/review')
}
