import type { DifficultyLevel } from '../types/question'

/** An inclusive range of whole numbers. */
export interface NumberRange {
  min: number
  max: number
}

export interface DifficultyRules {
  /**
   * Addition and subtraction: every operand and every answer stays in this range,
   * e.g. at Beginner, `4 + 5` but never `7 + 8`.
   */
  addSubtract: NumberRange
  /**
   * Multiplication and division: one factor comes from `table` (the times table being
   * practiced), the other from `multiplier`. Division uses `table` for the divisor and
   * `multiplier` for the answer.
   */
  table: NumberRange
  multiplier: NumberRange
}

/**
 * The number ranges for each difficulty level. Keep these in sync with the descriptions
 * in `DIFFICULTY_OPTIONS`, which tell the player what to expect.
 */
export const DIFFICULTY_RULES: Record<DifficultyLevel, DifficultyRules> = {
  beginner: {
    addSubtract: { min: 1, max: 10 },
    table: { min: 1, max: 5 },
    multiplier: { min: 1, max: 10 },
  },
  easy: {
    addSubtract: { min: 1, max: 20 },
    table: { min: 1, max: 10 },
    multiplier: { min: 1, max: 10 },
  },
  intermediate: {
    addSubtract: { min: 10, max: 100 },
    table: { min: 1, max: 12 },
    multiplier: { min: 1, max: 12 },
  },
  advanced: {
    addSubtract: { min: 100, max: 1000 },
    table: { min: 2, max: 12 },
    multiplier: { min: 10, max: 50 },
  },
}
