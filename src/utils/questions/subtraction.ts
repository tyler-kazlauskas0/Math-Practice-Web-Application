import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import type { DifficultyLevel, Question } from '../../types/question'
import { createId } from '../id'
import { randomInt, type RandomSource } from '../random'
import { formatQuestion } from './formatQuestion'

/**
 * Creates a subtraction question with operands in the difficulty's range. The first
 * operand is never smaller than the second, so the answer is never negative.
 */
export function generateSubtractionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { min, max } = DIFFICULTY_RULES[difficulty].addSubtract
  const leftOperand = randomInt(min, max, random)
  const rightOperand = randomInt(min, leftOperand, random)

  return {
    id: createId(),
    operation: 'subtraction',
    difficulty,
    leftOperand,
    rightOperand,
    correctAnswer: leftOperand - rightOperand,
    displayText: formatQuestion(leftOperand, 'subtraction', rightOperand),
  }
}
