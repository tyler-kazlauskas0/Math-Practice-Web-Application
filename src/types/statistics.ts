import type { DifficultyLevel, MathOperation, Question } from './question'
import type { PracticeConfig } from './session'

/** Totals shared by every statistics breakdown. */
export interface AttemptStatistics {
  totalAttempts: number
  correctAttempts: number
  incorrectAttempts: number
  /** Fraction of attempts answered correctly, from 0 to 1. 0 when there are no attempts. */
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

/** The results of one finished practice session, shown on the summary page. */
export interface SessionSummary extends AttemptStatistics {
  sessionId: string
  config: PracticeConfig
  /** Only the operations that were actually asked, in the usual order. */
  byOperation: OperationStatistics[]
  /** Questions marked wrong, once each, for the Practice Mistakes button. */
  mistakes: Question[]
  /** `true` if this was a mistake-review session. */
  isReview: boolean
  /** Results for questions made from saved mistakes, or `null` if there were none. */
  mistakeReview: MistakeReviewSummary | null
  startedAt: string
  completedAt: string
}

export interface MistakeReviewSummary {
  /** Questions related to saved mistakes. */
  questions: number
  correct: number
  /** Different saved mistakes those questions came from. */
  patternsPracticed: number
  /** Saved mistakes mastered during this session. */
  mastered: number
}
