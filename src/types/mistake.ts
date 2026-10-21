import type { DifficultyLevel, MathOperation } from './question'

/**
 * A math fact the player has answered incorrectly (e.g. `7 × 8`), used to bring that fact
 * back for extra practice. There is one pattern per fact.
 */
export interface MistakePattern {
  /**
   * Identifies the fact, e.g. `multiplication:7:8`. For addition and multiplication the
   * order doesn't matter, so `7 × 8` and `8 × 7` share one pattern.
   */
  key: string
  operation: MathOperation
  /** The operands as asked the first time the mistake was made. */
  leftOperand: number
  rightOperand: number
  correctAnswer: number
  /** The difficulty level of the most recent mistake. */
  difficulty: DifficultyLevel
  /** How many times this fact has been answered incorrectly. */
  incorrectCount: number
  /**
   * Correct answers to this fact since the last mistake: progress toward mastering it.
   * Starts at 0 and goes back to 0 after every new mistake.
   */
  similarCorrectCount: number
  /** The most recent wrong answers given, oldest first (at most `MAX_SAVED_WRONG_ANSWERS`). */
  incorrectAnswers: number[]
  /** ISO 8601 timestamp of the first mistake. */
  firstIncorrectAt: string
  /** ISO 8601 timestamp of the most recent mistake. */
  lastIncorrectAt: string
}
