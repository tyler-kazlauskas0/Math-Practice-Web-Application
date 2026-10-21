import type { MistakePattern } from '../types/mistake'
import type { RandomSource } from './random'
import { activePatterns } from './mistakePatterns'

const DAY_MS = 24 * 60 * 60 * 1000

/** How much each factor counts toward a pattern's priority. */
export const PRIORITY_WEIGHTS = {
  /** Missed many times. Counts up to `FREQUENT_MISS_CAP` misses. */
  frequency: 3,
  /** Missed recently. Halves after about a week. */
  recency: 2,
  /** Little progress toward mastery so far. */
  lowSuccess: 2,
}
const FREQUENT_MISS_CAP = 5

/**
 * Patterns whose priorities are closer than this are put in random order, so review is
 * varied instead of always starting with the same fact.
 */
export const SIMILAR_PRIORITY_RANGE = 0.5

/** How urgently a pattern needs review, from 0 to 7. Higher means review it sooner. */
export function mistakePriority(pattern: MistakePattern, now: number, threshold: number): number {
  const frequency = Math.min(pattern.incorrectCount, FREQUENT_MISS_CAP) / FREQUENT_MISS_CAP
  const daysSinceMiss = Math.max(0, now - Date.parse(pattern.lastIncorrectAt)) / DAY_MS
  const recency = 1 / (1 + daysSinceMiss / 7)
  const lowSuccess = 1 - Math.min(pattern.similarCorrectCount, threshold) / threshold

  return (
    PRIORITY_WEIGHTS.frequency * frequency +
    PRIORITY_WEIGHTS.recency * recency +
    PRIORITY_WEIGHTS.lowSuccess * lowSuccess
  )
}

/**
 * The patterns that still need review (mastered ones are left out), most urgent first.
 * Each priority gets a small random nudge, which shuffles patterns of similar priority
 * without ever putting a much less urgent pattern ahead of a much more urgent one.
 */
export function prioritizePatterns(
  patterns: MistakePattern[],
  {
    now,
    threshold,
    random = Math.random,
  }: { now: number; threshold: number; random?: RandomSource },
): MistakePattern[] {
  return activePatterns(patterns)
    .map((pattern) => ({
      pattern,
      score: mistakePriority(pattern, now, threshold) + random() * SIMILAR_PRIORITY_RANGE,
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ pattern }) => pattern)
}
