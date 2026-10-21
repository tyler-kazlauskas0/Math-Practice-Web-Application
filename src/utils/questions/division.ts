import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import type { DifficultyLevel, Question } from '../../types/question'
import { createId } from '../id'
import { randomInt, type RandomSource } from '../random'
import { formatQuestion } from './formatQuestion'

/**
 * Creates a division question that always divides evenly. It works backwards from a
 * multiplication fact: pick the divisor and the answer, then multiply to get the dividend.
 */
export function generateDivisionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { table, multiplier } = DIFFICULTY_RULES[difficulty]
  // Never zero, even if a rule's range starts at 0.
  const divisor = randomInt(Math.max(1, table.min), table.max, random)
  const quotient = randomInt(multiplier.min, multiplier.max, random)
  const dividend = divisor * quotient

  return {
    id: createId(),
    operation: 'division',
    difficulty,
    leftOperand: dividend,
    rightOperand: divisor,
    correctAnswer: quotient,
    displayText: formatQuestion(dividend, 'division', divisor),
  }
}
