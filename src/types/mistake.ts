import type { MathOperation } from './question'

/**
 * A math fact the player keeps getting wrong (e.g. `7 × 8`), used to bring
 * that fact back for extra practice.
 */
export interface MistakePattern {
  operation: MathOperation
  leftOperand: number
  rightOperand: number
  correctAnswer: number
  /** The wrong answers given for this fact, oldest first. */
  incorrectAnswers: number[]
  /** How many times this fact has been answered incorrectly. */
  mistakeCount: number
  /** ISO 8601 timestamp of the most recent mistake. */
  lastMistakeAt: string
}
