import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { ALMOST_ONE, randomSequence, repeat } from '../../test/randomSequence'
import type { DifficultyLevel } from '../../types/question'
import { generateAdditionQuestion } from './addition'
import { isValidQuestion } from './validateQuestion'

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

describe('generateAdditionQuestion', () => {
  it('returns a valid addition question with display text', () => {
    const question = generateAdditionQuestion('easy', randomSequence(0.25, 0.5))

    expect(question).toMatchObject({ operation: 'addition', difficulty: 'easy' })
    expect(question.correctAnswer).toBe(question.leftOperand + question.rightOperand)
    expect(question.displayText).toBe(`${question.leftOperand} + ${question.rightOperand}`)
    expect(isValidQuestion(question)).toBe(true)
  })

  describe.each(LEVELS)('at %s', (difficulty) => {
    const { min, max } = DIFFICULTY_RULES[difficulty].addSubtract

    it('uses the minimum operands when random is lowest', () => {
      const question = generateAdditionQuestion(difficulty, () => 0)

      expect(question.leftOperand).toBe(min)
      expect(question.rightOperand).toBe(min)
    })

    it('can reach the maximum operand on either side', () => {
      const bigLeft = generateAdditionQuestion(difficulty, randomSequence(ALMOST_ONE, 0))
      const bigRight = generateAdditionQuestion(difficulty, randomSequence(0, ALMOST_ONE))

      expect(bigLeft.leftOperand).toBe(max - min)
      expect(bigRight.rightOperand).toBe(max - min)
    })

    it('never lets the answer go above the maximum', () => {
      const atLimit = generateAdditionQuestion(difficulty, () => ALMOST_ONE)
      expect(atLimit.correctAnswer).toBe(max)

      repeat(1000, () => {
        const question = generateAdditionQuestion(difficulty)
        expect(question.leftOperand).toBeGreaterThanOrEqual(min)
        expect(question.rightOperand).toBeGreaterThanOrEqual(min)
        expect(question.correctAnswer).toBeLessThanOrEqual(max)
        expect(isValidQuestion(question)).toBe(true)
      })
    })
  })
})
