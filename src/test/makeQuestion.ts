import type { MathOperation, Question } from '../types/question'
import { formatQuestion } from '../utils/questions/formatQuestion'

const ANSWERS: Record<MathOperation, (a: number, b: number) => number> = {
  addition: (a, b) => a + b,
  subtraction: (a, b) => a - b,
  multiplication: (a, b) => a * b,
  division: (a, b) => a / b,
}

/** Builds a specific question for tests, e.g. `makeQuestion(56, 'division', 7)`. */
export function makeQuestion(left: number, operation: MathOperation, right: number): Question {
  return {
    id: 'test-question',
    operation,
    difficulty: 'easy',
    leftOperand: left,
    rightOperand: right,
    correctAnswer: ANSWERS[operation](left, right),
    displayText: formatQuestion(left, operation, right),
  }
}
