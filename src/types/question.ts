/** The four arithmetic operations the app can practice. */
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division'

/** How hard generated questions are (e.g. the size of the numbers used). */
export type DifficultyLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced'

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
  /** The question as shown to the player, e.g. `7 × 8`. */
  displayText: string
  /** Why the question was asked. Missing means an ordinary random practice question. */
  source?: QuestionSource
  /** For a `mistake-review` question, the key of the mistake pattern it was made from. */
  mistakePatternId?: string
}

/** Where a question came from: random practice, or practice built from a past mistake. */
export type QuestionSource = 'practice' | 'mistake-review'
