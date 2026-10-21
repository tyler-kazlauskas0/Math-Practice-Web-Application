import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES, type NumberRange } from '../../data/difficultyRules'
import { ALMOST_ONE, randomSequence, repeat } from '../../test/randomSequence'
import type { DifficultyLevel } from '../../types/question'
import { generateMultiplicationQuestion } from './multiplication'
import { isValidQuestion } from './validateQuestion'

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

const inRange = (value: number, { min, max }: NumberRange) => value >= min && value <= max

describe('generateMultiplicationQuestion', () => {
  it('returns a valid multiplication question with display text', () => {
    const question = generateMultiplicationQuestion('easy', randomSequence(0.6, 0.7, 0.2))

    expect(question).toMatchObject({ operation: 'multiplication', difficulty: 'easy' })
    expect(question.correctAnswer).toBe(question.leftOperand * question.rightOperand)
    expect(question.displayText).toBe(`${question.leftOperand} × ${question.rightOperand}`)
    expect(isValidQuestion(question)).toBe(true)
  })

  it('puts the times-table factor on either side', () => {
    // Beginner: table 1–5, multiplier 1–10. Highest picks give 5 and 10.
    const tableFirst = generateMultiplicationQuestion(
      'beginner',
      randomSequence(ALMOST_ONE, ALMOST_ONE, 0),
    )
    const tableSecond = generateMultiplicationQuestion(
      'beginner',
      randomSequence(ALMOST_ONE, ALMOST_ONE, ALMOST_ONE),
    )

    expect(tableFirst.displayText).toBe('5 × 10')
    expect(tableSecond.displayText).toBe('10 × 5')
  })

  describe.each(LEVELS)('at %s', (difficulty) => {
    const { table, multiplier } = DIFFICULTY_RULES[difficulty]

    it('uses the lowest and highest factors at the edges of the range', () => {
      const lowest = generateMultiplicationQuestion(difficulty, () => 0)
      const highest = generateMultiplicationQuestion(
        difficulty,
        randomSequence(ALMOST_ONE, ALMOST_ONE, 0),
      )

      expect([lowest.leftOperand, lowest.rightOperand]).toEqual([table.min, multiplier.min])
      expect([highest.leftOperand, highest.rightOperand]).toEqual([table.max, multiplier.max])
    })

    it('keeps one factor in the times-table range and the other in the multiplier range', () => {
      repeat(1000, () => {
        const {
          leftOperand: a,
          rightOperand: b,
          ...question
        } = generateMultiplicationQuestion(difficulty)
        const factorsInRange =
          (inRange(a, table) && inRange(b, multiplier)) ||
          (inRange(b, table) && inRange(a, multiplier))

        expect(factorsInRange, `${a} × ${b}`).toBe(true)
        expect(question.correctAnswer).toBe(a * b)
      })
    })
  })
})
