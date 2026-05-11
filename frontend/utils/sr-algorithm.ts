/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak.
 * Calculates the next review interval and updated ease factor
 * given the current card state and a review outcome.
 *
 * ease factor (EF) — starts at 2.5, minimum 1.3
 * repeat_interval  — days until next review (0 = same day)
 */

export type ReviewOutcome = 'pass' | 'hard' | 'fail'

export interface CardState {
  repeat_interval: number  // current interval in days
  difficulty: number       // ease factor (EF), e.g. 2.5
  review_count: number
}

export interface ReviewResult {
  repeat_interval: number  // new interval
  difficulty: number       // new ease factor
  review_count: number
  next_review_time: Date
}

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

  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let newEF = card.difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEF < 1.3) newEF = 1.3
  newEF = Math.round(newEF * 100) / 100

  let newInterval: number

  if (quality < 3) {
    // Failed — reset to beginning
    newInterval = 0
  } else if (card.review_count === 0) {
    newInterval = 1
  } else if (card.review_count === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(card.repeat_interval * newEF)
  }

  const nextReviewTime = new Date(now)
  nextReviewTime.setDate(nextReviewTime.getDate() + newInterval)

  return {
    repeat_interval: newInterval,
    difficulty: newEF,
    review_count: quality < 3 ? card.review_count : card.review_count + 1,
    next_review_time: nextReviewTime,
  }
}

/**
 * Returns true if a card is due for review.
 */
export function isDue(next_review_time: string | null, now: Date = new Date()): boolean {
  if (!next_review_time) return true
  return new Date(next_review_time) <= now
}

/**
 * A card is considered "mature" once its interval exceeds 21 days.
 */
export function isMature(repeat_interval: number): boolean {
  return repeat_interval > 21
}
