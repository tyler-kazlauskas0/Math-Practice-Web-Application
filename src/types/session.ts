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

/** The question currently on screen and its multiple-choice answers. */
export interface PracticeRound {
  question: Question
  choices: number[]
}

/**
 * Everything the practice page tracks while a session runs. The session ID, operations,
 * difficulty, and length are in the `PracticeSession` fields (`id` and `config`).
 */
export interface PracticeSessionState extends PracticeSession {
  /** The current question's position, starting at 0. */
  currentQuestionIndex: number
  /** `null` if a question couldn't be generated. */
  currentRound: PracticeRound | null
  /** When the current question appeared, in milliseconds (`Date.now()`). */
  questionShownAt: number
  correctCount: number
  incorrectCount: number
  /** `false` once the session has ended. */
  isActive: boolean
  /**
   * For a mistake-review session, the questions to ask again, in order. The session ends
   * after the last one. `null` for a normal session.
   */
  reviewQuestions: Question[] | null
  /**
   * For a mistake-review session, the mistake patterns (by key) in the order they take turns,
   * most urgent first. `null` for other sessions.
   */
  reviewPatternOrder: string[] | null
}

/**
 * What the practice page receives when a session starts: the setup choices, plus the
 * questions to ask again when it is a mistake-review session.
 */
export interface PracticeSessionRequest extends PracticeConfig {
  reviewQuestions?: Question[]
  /** `'mistake-review'` asks questions related to saved mistakes instead of random ones. */
  mode?: PracticeMode
}

/** Regular random practice, or practice built from the player's saved mistakes. */
export type PracticeMode = 'practice' | 'mistake-review'
