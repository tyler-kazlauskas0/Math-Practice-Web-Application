import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import type { DifficultyLevel, MathOperation, Question } from '../../types/question'
import { createId } from '../id'
import { formatQuestion } from './formatQuestion'

/**
 * A simple question that is always valid, used if normal generation keeps failing. It uses
 * the smallest numbers allowed at the difficulty level, e.g. 1 + 1 at Beginner or
 * 20 − 10 at Intermediate. Unknown operations or levels fall back to Beginner addition.
 */
export function createFallbackQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
): Question {
  const safeOperation = OPERATION_OPTIONS.some((option) => option.value === operation)
    ? operation
    : 'addition'
  const safeDifficulty = difficulty in DIFFICULTY_RULES ? difficulty : 'beginner'
  const { addSubtract, table, multiplier } = DIFFICULTY_RULES[safeDifficulty]
  const divisor = Math.max(1, table.min)

  const facts: Record<MathOperation, [left: number, right: number, answer: number]> = {
    addition: [addSubtract.min, addSubtract.min, addSubtract.min * 2],
    subtraction: [addSubtract.min * 2, addSubtract.min, addSubtract.min],
    multiplication: [table.min, multiplier.min, table.min * multiplier.min],
    division: [divisor * multiplier.min, divisor, multiplier.min],
  }
  const [left, right, answer] = facts[safeOperation]

  return {
    id: createId(),
    operation: safeOperation,
    difficulty: safeDifficulty,
    leftOperand: left,
    rightOperand: right,
    correctAnswer: answer,
    displayText: formatQuestion(left, safeOperation, right),
  }
}
