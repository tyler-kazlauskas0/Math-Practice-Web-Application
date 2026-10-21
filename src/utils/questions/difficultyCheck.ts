import { DIFFICULTY_RULES, type NumberRange } from '../../data/difficultyRules'
import type { DifficultyLevel, Question } from '../../types/question'

const inRange = (value: number, { min, max }: NumberRange) => value >= min && value <= max

/**
 * Whether a question follows a difficulty level's number ranges, using the same rules as
 * the random question generators:
 * - addition: both numbers at least the minimum, and the answer at most the maximum
 * - subtraction: both numbers in range (the answer is never negative)
 * - multiplication: one factor from the times-table range, the other from the multiplier range
 * - division: the divisor from the times-table range, the answer from the multiplier range
 */
export function fitsDifficulty(
  question: Pick<Question, 'operation' | 'leftOperand' | 'rightOperand' | 'correctAnswer'>,
  difficulty: DifficultyLevel,
): boolean {
  const { addSubtract, table, multiplier } = DIFFICULTY_RULES[difficulty]
  const { leftOperand: a, rightOperand: b, correctAnswer: answer } = question

  switch (question.operation) {
    case 'addition':
      return a >= addSubtract.min && b >= addSubtract.min && answer <= addSubtract.max
    case 'subtraction':
      return inRange(a, addSubtract) && inRange(b, addSubtract) && a >= b
    case 'multiplication':
      return (
        (inRange(a, table) && inRange(b, multiplier)) ||
        (inRange(b, table) && inRange(a, multiplier))
      )
    case 'division':
      return (
        inRange(b, { min: Math.max(1, table.min), max: table.max }) && inRange(answer, multiplier)
      )
  }
}
