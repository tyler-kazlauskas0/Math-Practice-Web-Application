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

/** A round of practice: a set of questions and the player's answers to them. */
export interface PracticeSession {
  id: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  /** How many questions the session was set up to ask. */
  questionCount: number
  attempts: PracticeAttempt[]
  /** ISO 8601 timestamp of when the session started. */
  startedAt: string
  /** ISO 8601 timestamp of when the session ended, or `null` while it is in progress. */
  completedAt: string | null
}
