/**
 * SM-2 Spaced Repetition Algorithm — Final Version
 *
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak.
 * Enhanced with fuzz factor, session queue builder, and streak logic.
 *
 * ease factor (EF) — starts at 2.5, minimum 1.3
 * repeat_interval  — days until next review
 */

export type ReviewOutcome = 'pass' | 'hard' | 'fail'

export interface CardState {
  repeat_interval: number  // current interval in days
  difficulty: number       // ease factor (EF), e.g. 2.5
  review_count: number
}

export interface ReviewResult {
  repeat_interval: number  // new interval (fuzzed)
  difficulty: number       // new ease factor
  review_count: number
  last_review_time: Date
  next_review_time: Date
}

// ============================================================
// Core Algorithm
// ============================================================

/**
 * Maps outcome to SM-2 quality score (0–5).
 *   pass → 4  (correct, moderate effort)
 *   hard → 2  (correct but very hard)
 *   fail → 0  (blackout)
 */
function outcomeToQuality(outcome: ReviewOutcome): number {
  switch (outcome) {
    case 'pass': return 4
    case 'hard': return 2
    case 'fail': return 0
  }
}

/**
 * Calculate the new card state after a review.
 */
export function calculateNextReview(
  card: CardState,
  outcome: ReviewOutcome,
  now: Date = new Date(),
): ReviewResult {
  const quality = outcomeToQuality(outcome)

  // SM-2 ease factor formula
  let newEF = card.difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEF < 1.3) newEF = 1.3
  newEF = Math.round(newEF * 100) / 100

  let newInterval: number

  if (quality < 3) {
    // Failed — reset to 1 day (not 0, gives a night's sleep before retry)
    newInterval = 1
  } else if (card.review_count === 0) {
    newInterval = 1
  } else if (card.review_count === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(card.repeat_interval * newEF)
  }

  const fuzzedInterval = applyFuzz(newInterval)

  const nextReviewTime = new Date(now)
  nextReviewTime.setDate(nextReviewTime.getDate() + fuzzedInterval)

  return {
    repeat_interval: fuzzedInterval,
    difficulty: newEF,
    review_count: quality < 3 ? card.review_count : card.review_count + 1,
    last_review_time: now,
    next_review_time: nextReviewTime,
  }
}

// ============================================================
// Fuzz Factor
// ============================================================

/**
 * Adds ±5% randomness to an interval.
 * Prevents cards added on the same day from always clustering together.
 */
function applyFuzz(interval: number): number {
  if (interval <= 1) return interval
  const fuzz = Math.max(1, Math.round(interval * 0.05))
  return interval + Math.floor(Math.random() * (fuzz * 2 + 1)) - fuzz
}

// ============================================================
// Session Queue Builder
// ============================================================

export interface CardWithState extends CardState {
  id: string
  next_review_time: Date | null
  created_at: Date
}

export type CardCategory = 'overdue' | 'due' | 'new'

export interface QueuedCard {
  card: CardWithState
  category: CardCategory
}

/**
 * Builds an ordered review queue from a list of cards.
 *
 * Order:
 *   1. Overdue cards (most overdue first)
 *   2. Due today (hardest first — lowest EF)
 *   3. New cards (capped at maxNewCards to avoid overwhelm)
 */
export function buildSessionQueue(
  cards: CardWithState[],
  now: Date = new Date(),
  maxNewCards: number = 20,
): QueuedCard[] {
  const overdue: QueuedCard[] = []
  const due: QueuedCard[] = []
  const newCards: QueuedCard[] = []

  for (const card of cards) {
    if (!card.next_review_time) {
      newCards.push({ card, category: 'new' })
    } else if (card.next_review_time <= now) {
      const daysPast = daysBetween(card.next_review_time, now)
      if (daysPast > 1) {
        overdue.push({ card, category: 'overdue' })
      } else {
        due.push({ card, category: 'due' })
      }
    }
  }

  // Most overdue first
  overdue.sort((a, b) =>
    a.card.next_review_time!.getTime() - b.card.next_review_time!.getTime()
  )

  // Hardest due cards first (lowest EF = most difficult)
  due.sort((a, b) => a.card.difficulty - b.card.difficulty)

  // Cap new cards per session
  const cappedNew = newCards.slice(0, maxNewCards)

  return [...overdue, ...due, ...cappedNew]
}

// ============================================================
// Streak Logic
// ============================================================

export interface StreakState {
  current_streak: number
  longest_streak: number
  last_reviewed_date: Date | null
}

export interface StreakResult {
  current_streak: number
  longest_streak: number
  last_reviewed_date: Date
}

/**
 * Updates the streak after a completed review session.
 * - Same day: no change
 * - Yesterday: extend streak
 * - Older: reset to 1
 */
export function updateStreak(
  streak: StreakState,
  reviewedAt: Date = new Date(),
): StreakResult {
  const today = toDateOnly(reviewedAt)
  const lastDate = streak.last_reviewed_date
    ? toDateOnly(streak.last_reviewed_date)
    : null

  if (lastDate && isSameDay(lastDate, today)) {
    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_reviewed_date: reviewedAt,
    }
  }

  if (lastDate && isYesterday(lastDate, today)) {
    const newStreak = streak.current_streak + 1
    return {
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      last_reviewed_date: reviewedAt,
    }
  }

  return {
    current_streak: 1,
    longest_streak: Math.max(1, streak.longest_streak),
    last_reviewed_date: reviewedAt,
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Returns true if a card is due for review.
 */
export function isDue(next_review_time: string | null, now: Date = new Date()): boolean {
  if (!next_review_time) return true
  return new Date(next_review_time) <= now
}

/**
 * A card is "mature" once its interval exceeds 21 days.
 */
export function isMature(repeat_interval: number): boolean {
  return repeat_interval > 21
}

/**
 * Daily goal progress.
 */
export function getDailyProgress(
  reviewedTodayCount: number,
  dailyGoal: number,
): { reviewed: number; goal: number; percent: number; isComplete: boolean } {
  const percent = Math.min(Math.round((reviewedTodayCount / dailyGoal) * 100), 100)
  return {
    reviewed: reviewedTodayCount,
    goal: dailyGoal,
    percent,
    isComplete: reviewedTodayCount >= dailyGoal,
  }
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime())
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime()
}

function isYesterday(past: Date, today: Date): boolean {
  const diff = today.getTime() - past.getTime()
  return diff === 24 * 60 * 60 * 1000
}

// ============================================================
// Usage Example
// ============================================================
//
// // After each card review:
// const result = calculateNextReview(card, 'pass')
// await supabase.from('cards').update({
//   difficulty:        result.difficulty,
//   repeat_interval:   result.repeat_interval,
//   review_count:      result.review_count,
//   last_review_time:  result.last_review_time,
//   next_review_time:  result.next_review_time,
// }).eq('id', card.id)
//
// // Log the review:
// await supabase.from('card_reviews').insert({
//   card_id:         card.id,
//   session_id:      sessionId,
//   outcome:         'pass',
//   interval_before: card.repeat_interval,
//   interval_after:  result.repeat_interval,
// })
//
// // At end of session, update streak:
// const newStreak = updateStreak(currentStreak)
// await supabase.from('user_streaks').update(newStreak).eq('id', userId)