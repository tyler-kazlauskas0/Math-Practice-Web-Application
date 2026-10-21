import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import type { DifficultyLevel, MathOperation } from '../types/question'
import { fitsDifficulty } from '../utils/questions/difficultyCheck'
import { DIFFICULTY_RULES } from './difficultyRules'
import { DIFFICULTY_OPTIONS } from './practiceOptions'

type Case = [left: number, operation: MathOperation, right: number]

/**
 * The questions exactly at each level's limits, and ones just past them. Written out by hand
 * so a change to `DIFFICULTY_RULES` has to be made on purpose.
 */
const BOUNDARIES: Record<DifficultyLevel, { inside: Case[]; outside: Case[] }> = {
  beginner: {
    inside: [
      [1, 'addition', 9],
      [10, 'subtraction', 1],
      [1, 'subtraction', 1],
      [5, 'multiplication', 10],
      [10, 'multiplication', 5],
      [50, 'division', 5],
      [1, 'division', 1],
    ],
    outside: [
      [1, 'addition', 10],
      [11, 'subtraction', 1],
      [6, 'multiplication', 11],
      [60, 'division', 6],
      [55, 'division', 5],
    ],
  },
  easy: {
    inside: [
      [10, 'addition', 10],
      [20, 'subtraction', 1],
      [10, 'multiplication', 10],
      [100, 'division', 10],
    ],
    outside: [
      [10, 'addition', 11],
      [21, 'subtraction', 1],
      [11, 'multiplication', 10],
      [110, 'division', 11],
      [110, 'division', 10],
    ],
  },
  intermediate: {
    inside: [
      [10, 'addition', 90],
      [100, 'subtraction', 10],
      [10, 'subtraction', 10],
      [12, 'multiplication', 12],
      [144, 'division', 12],
    ],
    outside: [
      [9, 'addition', 50],
      [50, 'addition', 51],
      [101, 'subtraction', 10],
      [50, 'subtraction', 9],
      [13, 'multiplication', 12],
      [156, 'division', 13],
      [156, 'division', 12],
    ],
  },
  advanced: {
    inside: [
      [100, 'addition', 900],
      [1000, 'subtraction', 100],
      [12, 'multiplication', 50],
      [2, 'multiplication', 10],
      [600, 'division', 12],
      [20, 'division', 2],
    ],
    outside: [
      [99, 'addition', 500],
      [500, 'addition', 501],
      [1001, 'subtraction', 100],
      [500, 'subtraction', 99],
      [1, 'multiplication', 10],
      [13, 'multiplication', 51],
      [612, 'division', 12],
      [10, 'division', 1],
    ],
  },
}

const LEVELS = DIFFICULTY_OPTIONS.map((option) => option.value)
const describeCase = ([left, operation, right]: Case) =>
  makeQuestion(left, operation, right).displayText

describe('difficulty boundaries', () => {
  describe.each(LEVELS)('%s', (level) => {
    it.each(BOUNDARIES[level].inside.map((c) => [describeCase(c), c] as const))(
      'accepts %s, at the edge of the level',
      (_, [left, operation, right]) => {
        expect(fitsDifficulty(makeQuestion(left, operation, right), level)).toBe(true)
      },
    )

    it.each(BOUNDARIES[level].outside.map((c) => [describeCase(c), c] as const))(
      'rejects %s, just past the edge',
      (_, [left, operation, right]) => {
        expect(fitsDifficulty(makeQuestion(left, operation, right), level)).toBe(false)
      },
    )
  })

  it('gets harder (or stays the same) from each level to the next', () => {
    LEVELS.slice(1).forEach((level, index) => {
      const easier = DIFFICULTY_RULES[LEVELS[index]]
      const harder = DIFFICULTY_RULES[level]

      expect(harder.addSubtract.max).toBeGreaterThan(easier.addSubtract.max)
      expect(harder.table.max).toBeGreaterThanOrEqual(easier.table.max)
      expect(harder.multiplier.max).toBeGreaterThanOrEqual(easier.multiplier.max)
    })
  })

  it('has sensible ranges: whole numbers, never below 1, min no larger than max', () => {
    Object.values(DIFFICULTY_RULES).forEach((rules) => {
      Object.values(rules).forEach(({ min, max }) => {
        expect(Number.isInteger(min) && Number.isInteger(max)).toBe(true)
        expect(min).toBeGreaterThanOrEqual(1)
        expect(min).toBeLessThanOrEqual(max)
      })
    })
  })

  it('describes each level with its real limits, so the player knows what to expect', () => {
    DIFFICULTY_OPTIONS.forEach(({ value, description }) => {
      const { addSubtract, table } = DIFFICULTY_RULES[value]

      expect(description).toContain(`up to ${addSubtract.max.toLocaleString('en-US')}`)
      expect(description).toContain(String(table.max))
    })
  })
})
