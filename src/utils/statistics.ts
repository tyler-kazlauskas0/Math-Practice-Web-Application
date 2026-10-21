import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../data/practiceOptions'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import type {
  AttemptStatistics,
  DifficultyStatistics,
  OperationStatistics,
  OverallStatistics,
} from '../types/statistics'

/** A right/total count, e.g. for answers no longer kept in full. */
export interface Tally {
  totalAttempts: number
  correctAttempts: number
}

const NO_TALLY: Tally = { totalAttempts: 0, correctAttempts: 0 }

/** Fraction answered correctly, from 0 to 1. Returns 0 (not NaN) when nothing was attempted. */
export function accuracyOf(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total
}

/** Totals, accuracy, and average time for a list of attempts, plus any extra counts to include. */
export function tallyAttempts(
  attempts: PracticeAttempt[],
  extra: Tally = NO_TALLY,
): AttemptStatistics {
  const totalAttempts = attempts.length + extra.totalAttempts
  const correctAttempts =
    attempts.filter((attempt) => attempt.isCorrect).length + extra.correctAttempts
  const totalTime = attempts.reduce((sum, attempt) => sum + attempt.timeTakenMs, 0)

  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts: totalAttempts - correctAttempts,
    accuracy: accuracyOf(correctAttempts, totalAttempts),
    // Only attempts kept in full have times.
    averageTimeMs: attempts.length === 0 ? 0 : Math.round(totalTime / attempts.length),
  }
}

/** The most answers marked right in a row, in the order they were answered. */
export function bestStreak(attempts: PracticeAttempt[]): number {
  const inOrder = [...attempts].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))
  let best = 0
  let current = 0
  for (const attempt of inOrder) {
    current = attempt.isCorrect ? current + 1 : 0
    best = Math.max(best, current)
  }
  return best
}

/** Earlier results that are only kept as totals (see `HistoryArchive`). */
export interface ArchivedTotals extends Tally {
  sessionCount: number
  byOperation: Record<MathOperation, Tally>
  byDifficulty: Record<DifficultyLevel, Tally>
}

/** Everything the Statistics page shows, from saved attempts plus archived totals. */
export function calculateStatistics(
  attempts: PracticeAttempt[],
  sessionCount: number,
  archive?: ArchivedTotals,
): OverallStatistics {
  const byOperation = Object.fromEntries(
    OPERATION_OPTIONS.map(({ value: operation }): [MathOperation, OperationStatistics] => [
      operation,
      {
        operation,
        ...tallyAttempts(
          attempts.filter((attempt) => attempt.question.operation === operation),
          archive?.byOperation[operation],
        ),
      },
    ]),
  ) as Record<MathOperation, OperationStatistics>

  const byDifficulty = Object.fromEntries(
    DIFFICULTY_OPTIONS.map(({ value: difficulty }): [DifficultyLevel, DifficultyStatistics] => [
      difficulty,
      {
        difficulty,
        ...tallyAttempts(
          attempts.filter((attempt) => attempt.question.difficulty === difficulty),
          archive?.byDifficulty[difficulty],
        ),
      },
    ]),
  ) as Record<DifficultyLevel, DifficultyStatistics>

  return {
    ...tallyAttempts(attempts, archive),
    totalSessions: sessionCount + (archive?.sessionCount ?? 0),
    bestStreak: bestStreak(attempts),
    byOperation,
    byDifficulty,
  }
}
