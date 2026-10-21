import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { ALMOST_ONE, randomSequence, repeat } from '../../test/randomSequence'
import type { DifficultyLevel } from '../../types/question'
import { generateDivisionQuestion } from './division'
import { isValidQuestion } from './validateQuestion'

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

describe('generateDivisionQuestion', () => {
  it('builds the dividend from the divisor and the answer', () => {
    // Easy: divisor from 1–10, answer from 1–10. 0.65 picks 7, 0.75 picks 8.
    const question = generateDivisionQuestion('easy', randomSequence(0.65, 0.75))

    expect(question).toMatchObject({
      operation: 'division',
      difficulty: 'easy',
      leftOperand: 56,
      rightOperand: 7,
      correctAnswer: 8,
      displayText: '56 ÷ 7',
    })
    expect(isValidQuestion(question)).toBe(true)
  })

  it('uses a divisor of at least 1 even when random is lowest', () => {
    LEVELS.forEach((difficulty) => {
      expect(generateDivisionQuestion(difficulty, () => 0).rightOperand).toBeGreaterThanOrEqual(1)
    })
  })

  describe.each(LEVELS)('at %s', (difficulty) => {
    const { table, multiplier } = DIFFICULTY_RULES[difficulty]

    it('reaches the highest divisor and answer for the level', () => {
      const question = generateDivisionQuestion(difficulty, () => ALMOST_ONE)

      expect(question.rightOperand).toBe(table.max)
      expect(question.correctAnswer).toBe(multiplier.max)
    })

    it('never divides by zero and always has a whole-number answer', () => {
      repeat(1000, () => {
        const question = generateDivisionQuestion(difficulty)

        expect(question.rightOperand).not.toBe(0)
        expect(Number.isInteger(question.correctAnswer)).toBe(true)
        expect(question.leftOperand % question.rightOperand).toBe(0)
        expect(question.leftOperand / question.rightOperand).toBe(question.correctAnswer)
        expect(question.rightOperand).toBeGreaterThanOrEqual(table.min)
        expect(question.rightOperand).toBeLessThanOrEqual(table.max)
        expect(question.correctAnswer).toBeGreaterThanOrEqual(multiplier.min)
        expect(question.correctAnswer).toBeLessThanOrEqual(multiplier.max)
      })
    })
  })
})
