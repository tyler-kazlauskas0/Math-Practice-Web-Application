import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import type { DifficultyLevel, Question } from '../../types/question'
import { createId } from '../id'
import { randomInt, type RandomSource } from '../random'
import { formatQuestion } from './formatQuestion'

/** Creates an addition question whose operands and sum all stay within the difficulty's range. */
export function generateAdditionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { min, max } = DIFFICULTY_RULES[difficulty].addSubtract
  // Leave room for the second operand, which is at least `min`.
  const leftOperand = randomInt(min, max - min, random)
  const rightOperand = randomInt(min, max - leftOperand, random)

  return {
    id: createId(),
    operation: 'addition',
    difficulty,
    leftOperand,
    rightOperand,
    correctAnswer: leftOperand + rightOperand,
    displayText: formatQuestion(leftOperand, 'addition', rightOperand),
  }
}
