/** The four arithmetic operations the app can practice. */
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division'

/** How hard generated questions are (e.g. the size of the numbers used). */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/** A single math problem, e.g. `7 × 8 = ?`. */
export interface Question {
  id: string
  operation: MathOperation
  difficulty: DifficultyLevel
  /** The number on the left of the operator. */
  leftOperand: number
  /** The number on the right of the operator. */
  rightOperand: number
  /** Always a whole number; division questions are generated to divide evenly. */
  correctAnswer: number
}
