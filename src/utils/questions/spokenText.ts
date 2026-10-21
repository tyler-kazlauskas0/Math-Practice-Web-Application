import type { MathOperation, Question } from '../../types/question'

const SPOKEN_OPERATORS: Record<MathOperation, string> = {
  addition: 'plus',
  subtraction: 'minus',
  multiplication: 'times',
  division: 'divided by',
}

type Fact = Pick<Question, 'leftOperand' | 'operation' | 'rightOperand'>

/** The question in words, e.g. "7 times 8", so screen readers don't read out symbols. */
export function speakFact({ leftOperand, operation, rightOperand }: Fact): string {
  return `${leftOperand} ${SPOKEN_OPERATORS[operation]} ${rightOperand}`
}

/** The front of the card, read aloud: "What is 7 times 8?" */
export const speakQuestion = (question: Fact) => `What is ${speakFact(question)}?`

/** The back of the card, read aloud: "7 times 8 equals 56." */
export const speakAnswer = (question: Fact & Pick<Question, 'correctAnswer'>) =>
  `${speakFact(question)} equals ${question.correctAnswer}.`
