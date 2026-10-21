import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import type { DifficultyLevel, Question } from '../../types/question'
import { createId } from '../id'
import { randomInt, type RandomSource } from '../random'
import { formatQuestion } from './formatQuestion'

/**
 * Creates a multiplication question: one factor from the difficulty's times-table range,
 * the other from its multiplier range, in either order.
 */
export function generateMultiplicationQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { table, multiplier } = DIFFICULTY_RULES[difficulty]
  const tableFactor = randomInt(table.min, table.max, random)
  const otherFactor = randomInt(multiplier.min, multiplier.max, random)
  // Mix up the order so the times-table number isn't always first.
  const [leftOperand, rightOperand] =
    random() < 0.5 ? [tableFactor, otherFactor] : [otherFactor, tableFactor]

  return {
    id: createId(),
    operation: 'multiplication',
    difficulty,
    leftOperand,
    rightOperand,
    correctAnswer: leftOperand * rightOperand,
    displayText: formatQuestion(leftOperand, 'multiplication', rightOperand),
  }
}
