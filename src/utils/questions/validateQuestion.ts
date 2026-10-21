import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../../data/practiceOptions'
import type { MathOperation, Question } from '../../types/question'
import { formatQuestion } from './formatQuestion'

function isWholeNumber(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

function isCorrect(operation: MathOperation, left: number, right: number, answer: number) {
  switch (operation) {
    case 'addition':
      return left + right === answer
    case 'subtraction':
      return left - right === answer
    case 'multiplication':
      return left * right === answer
    case 'division':
      return right !== 0 && right * answer === left
  }
}

/**
 * Checks that a question is safe to show: known operation and difficulty, whole
 * non-negative numbers, no division by zero, a correct answer, and matching display text.
 */
export function isValidQuestion(question: Question): boolean {
  const { id, operation, difficulty, leftOperand, rightOperand, correctAnswer, displayText } =
    question

  return (
    typeof id === 'string' &&
    id !== '' &&
    OPERATION_OPTIONS.some((option) => option.value === operation) &&
    DIFFICULTY_OPTIONS.some((option) => option.value === difficulty) &&
    isWholeNumber(leftOperand) &&
    isWholeNumber(rightOperand) &&
    isWholeNumber(correctAnswer) &&
    isCorrect(operation, leftOperand, rightOperand, correctAnswer) &&
    displayText === formatQuestion(leftOperand, operation, rightOperand)
  )
}
