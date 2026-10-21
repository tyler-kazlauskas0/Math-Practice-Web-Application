import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { ALMOST_ONE, randomSequence, repeat } from '../../test/randomSequence'
import type { DifficultyLevel } from '../../types/question'
import { generateSubtractionQuestion } from './subtraction'
import { isValidQuestion } from './validateQuestion'

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

describe('generateSubtractionQuestion', () => {
  it('returns a valid subtraction question with display text', () => {
    const question = generateSubtractionQuestion('easy', randomSequence(0.75, 0.5))

    expect(question).toMatchObject({ operation: 'subtraction', difficulty: 'easy' })
    expect(question.correctAnswer).toBe(question.leftOperand - question.rightOperand)
    expect(question.displayText).toBe(`${question.leftOperand} − ${question.rightOperand}`)
    expect(isValidQuestion(question)).toBe(true)
  })

  describe.each(LEVELS)('at %s', (difficulty) => {
    const { min, max } = DIFFICULTY_RULES[difficulty].addSubtract

    it('keeps operands within the difficulty range', () => {
      const lowest = generateSubtractionQuestion(difficulty, () => 0)
      const highest = generateSubtractionQuestion(difficulty, () => ALMOST_ONE)

      expect([lowest.leftOperand, lowest.rightOperand]).toEqual([min, min])
      expect([highest.leftOperand, highest.rightOperand]).toEqual([max, max])
    })

    it('never makes the first operand smaller than the second, so answers are never negative', () => {
      repeat(1000, () => {
        const question = generateSubtractionQuestion(difficulty)
        expect(question.leftOperand).toBeGreaterThanOrEqual(question.rightOperand)
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0)
        expect(question.leftOperand).toBeLessThanOrEqual(max)
        expect(question.rightOperand).toBeGreaterThanOrEqual(min)
        expect(isValidQuestion(question)).toBe(true)
      })
    })
  })
})
