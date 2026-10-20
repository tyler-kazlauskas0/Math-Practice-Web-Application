import type { DifficultyLevel, MathOperation, Question } from './question'

/** One answer the player gave to a question. */
export interface PracticeAttempt {
  question: Question
  userAnswer: number
  isCorrect: boolean
  /** How long the player took to answer, in milliseconds. */
  timeTakenMs: number
  /** ISO 8601 timestamp of when the answer was submitted. */
  answeredAt: string
}

/** How many questions a session asks, or `'continuous'` to keep going until the player stops. */
export type SessionLength = 5 | 10 | 20 | 'continuous'

/** The choices made on the practice setup page. */
export interface PracticeConfig {
  /** Which operations to practice. Always has at least one entry. */
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
}

/** A round of practice: a set of questions and the player's answers to them. */
export interface PracticeSession {
  id: string
  config: PracticeConfig
  attempts: PracticeAttempt[]
  /** ISO 8601 timestamp of when the session started. */
  startedAt: string
  /** ISO 8601 timestamp of when the session ended, or `null` while it is in progress. */
  completedAt: string | null
}
