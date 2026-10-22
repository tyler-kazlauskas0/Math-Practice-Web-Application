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

/** Runs of answers marked right: the longest, and the one still going at the end. */
export interface Streaks {
  best: number
  trailing: number
}

/**
 * The runs of right answers in `attempts`, in the order they were answered. Pass the runs of
 * earlier answers to carry on from them, so a run that started earlier is counted whole.
 */
export function streaks(
  attempts: PracticeAttempt[],
  earlier: Streaks = { best: 0, trailing: 0 },
): Streaks {
  const inOrder = [...attempts].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))
  let { best, trailing } = earlier
  for (const attempt of inOrder) {
    trailing = attempt.isCorrect ? trailing + 1 : 0
    best = Math.max(best, trailing)
  }
  return { best, trailing }
}

/** The most answers marked right in a row, in the order they were answered. */
export const bestStreak = (attempts: PracticeAttempt[], earlier?: Streaks) =>
  streaks(attempts, earlier).best

/**
 * Earlier results that are only kept as totals (see `HistoryArchive`): everything the
 * Statistics page shows, so nothing changes when answers stop being kept in full.
 */
export interface ArchivedTotals extends Tally {
  sessionCount: number
  byOperation: Record<MathOperation, Tally>
  byDifficulty: Record<DifficultyLevel, Tally>
  /** Runs of right answers among the archived answers, to continue the best streak from. */
  streaks: Streaks
  /** Mistake-review answers among them. */
  review: Tally
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
    bestStreak: bestStreak(attempts, archive?.streaks),
    byOperation,
    byDifficulty,
  }
}
