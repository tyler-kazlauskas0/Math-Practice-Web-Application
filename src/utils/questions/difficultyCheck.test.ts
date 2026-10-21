import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import { makeQuestion } from '../../test/makeQuestion'
import { repeat } from '../../test/randomSequence'
import type { DifficultyLevel } from '../../types/question'
import { fitsDifficulty } from './difficultyCheck'
import { generateQuestion } from './generateQuestion'

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

describe('fitsDifficulty', () => {
  it.each(OPERATION_OPTIONS.flatMap(({ value }) => LEVELS.map((level) => [value, level] as const)))(
    'accepts every random %s question at %s',
    (operation, difficulty) => {
      repeat(300, () => {
        expect(fitsDifficulty(generateQuestion(operation, difficulty), difficulty)).toBe(true)
      })
    },
  )

  it.each([
    ['an addition answer over the maximum', makeQuestion(7, 'addition', 8), 'beginner'],
    ['an addition number under the minimum', makeQuestion(5, 'addition', 50), 'intermediate'],
    ['a subtraction number over the maximum', makeQuestion(12, 'subtraction', 3), 'beginner'],
    ['a times table beyond the level', makeQuestion(7, 'multiplication', 8), 'beginner'],
    ['a divisor beyond the level', makeQuestion(56, 'division', 7), 'beginner'],
    ['an Advanced multiplier at Easy', makeQuestion(5, 'multiplication', 20), 'easy'],
  ] as const)('rejects %s', (_, question, difficulty) => {
    expect(fitsDifficulty(question, difficulty)).toBe(false)
  })

  it('accepts multiplication factors in either order', () => {
    expect(fitsDifficulty(makeQuestion(4, 'multiplication', 9), 'beginner')).toBe(true)
    expect(fitsDifficulty(makeQuestion(9, 'multiplication', 4), 'beginner')).toBe(true)
  })
})
