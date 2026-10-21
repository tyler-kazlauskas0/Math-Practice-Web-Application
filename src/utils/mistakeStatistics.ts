import { OPERATION_OPTIONS } from '../data/practiceOptions'
import type { MistakePattern } from '../types/mistake'
import type { MathOperation } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import type { OperationStatistics } from '../types/statistics'
import { isMastered } from './mistakePatterns'
import { formatQuestion } from './questions/formatQuestion'

export interface MistakeSummary {
  /** Mistakes that still need review. */
  activeCount: number
  masteredCount: number
  /** Questions asked in mistake review (related to a saved mistake). */
  reviewQuestions: number
  /** Of those, how many were answered correctly. */
  reviewCorrect: number
}

/** Totals for the Mistakes section of the Statistics page. */
export function summarizeMistakes(
  patterns: MistakePattern[],
  attempts: PracticeAttempt[],
): MistakeSummary {
  const review = attempts.filter((attempt) => attempt.question.source === 'mistake-review')
  const masteredCount = patterns.filter(isMastered).length
  return {
    activeCount: patterns.length - masteredCount,
    masteredCount,
    reviewQuestions: review.length,
    reviewCorrect: review.filter((attempt) => attempt.isCorrect).length,
  }
}

/**
 * The operation(s) answered wrong most often. Several are returned when they tie, in the
 * usual operation order. Empty when nothing has been answered wrong.
 */
export function mostMissedOperations(
  byOperation: Record<MathOperation, OperationStatistics>,
): MathOperation[] {
  const most = Math.max(
    ...OPERATION_OPTIONS.map(({ value }) => byOperation[value].incorrectAttempts),
  )
  if (most === 0) return []
  return OPERATION_OPTIONS.map(({ value }) => value).filter(
    (operation) => byOperation[operation].incorrectAttempts === most,
  )
}

/**
 * Mistakes sorted by how often they were missed, most first. Ties go to the one missed most
 * recently, then to the usual reading order of the fact, so the order is always the same.
 */
export function sortByIncorrectCount(patterns: MistakePattern[]): MistakePattern[] {
  return [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      b.lastIncorrectAt.localeCompare(a.lastIncorrectAt) ||
      a.key.localeCompare(b.key, undefined, { numeric: true }),
  )
}

/** The facts missed most often, e.g. for a "most missed" list. */
export function mostMissedFacts(patterns: MistakePattern[], limit = 5): MistakePattern[] {
  return sortByIncorrectCount(patterns).slice(0, limit)
}

/** The full fact, e.g. `7 × 8 = 56`. */
export function describeFact(pattern: MistakePattern): string {
  return `${formatQuestion(pattern.leftOperand, pattern.operation, pattern.rightOperand)} = ${
    pattern.correctAnswer
  }`
}
