import { describe, expect, it } from 'vitest'
import type { Question } from '../../types/question'
import { isValidQuestion } from './validateQuestion'

const valid: Question = {
  id: 'q1',
  operation: 'division',
  difficulty: 'easy',
  leftOperand: 56,
  rightOperand: 7,
  correctAnswer: 8,
  displayText: '56 ÷ 7',
}

describe('isValidQuestion', () => {
  it('accepts a correct question', () => {
    expect(isValidQuestion(valid)).toBe(true)
  })

  it.each<[string, Partial<Question>]>([
    ['a wrong answer', { correctAnswer: 9 }],
    ['division by zero', { rightOperand: 0, correctAnswer: 0, displayText: '56 ÷ 0' }],
    ['an uneven division', { leftOperand: 57, displayText: '57 ÷ 7' }],
    [
      'a negative answer',
      {
        operation: 'subtraction',
        leftOperand: 3,
        rightOperand: 5,
        correctAnswer: -2,
        displayText: '3 − 5',
      },
    ],
    ['a fractional number', { leftOperand: 56.5, displayText: '56.5 ÷ 7' }],
    ['NaN', { correctAnswer: Number.NaN }],
    ['mismatched display text', { displayText: '56 ÷ 8' }],
    ['an empty id', { id: '' }],
    ['an unknown operation', { operation: 'modulo' as Question['operation'] }],
    ['an unknown difficulty', { difficulty: 'hard' as Question['difficulty'] }],
  ])('rejects %s', (_, change) => {
    expect(isValidQuestion({ ...valid, ...change })).toBe(false)
  })
})
