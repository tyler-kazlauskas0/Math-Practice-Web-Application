import type { DifficultyLevel, MathOperation } from './question'

/** Totals shared by every statistics breakdown. */
export interface AttemptStatistics {
  totalAttempts: number
  correctAttempts: number
  /** Fraction of attempts answered correctly, from 0 to 1. */
  accuracy: number
  /** Average time per answer, in milliseconds. */
  averageTimeMs: number
}

/** Statistics for one operation, e.g. all multiplication questions. */
export interface OperationStatistics extends AttemptStatistics {
  operation: MathOperation
}

/** Statistics for one difficulty level. */
export interface DifficultyStatistics extends AttemptStatistics {
  difficulty: DifficultyLevel
}

/** The player's progress across every practice session. */
export interface OverallStatistics extends AttemptStatistics {
  totalSessions: number
  /** Most questions answered correctly in a row. */
  bestStreak: number
  byOperation: Record<MathOperation, OperationStatistics>
  byDifficulty: Record<DifficultyLevel, DifficultyStatistics>
}
