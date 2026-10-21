import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import { makeQuestion } from '../../test/makeQuestion'
import { repeat } from '../../test/randomSequence'
import type { DifficultyLevel, Question } from '../../types/question'
import {
  addWithoutCarrying,
  commonMistakes,
  generateDistractors,
  nearbyNumber,
  subtractWithoutBorrowing,
} from './distractors'
import { generateQuestion } from './generateQuestion'

const OPERATIONS = OPERATION_OPTIONS.map((option) => option.value)
const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

/** Checks the rules every set of distractors must follow. */
function expectValidDistractors(question: Question, distractors: number[]) {
  const label = `${question.displayText} → ${distractors.join(', ')}`
  expect(distractors, label).toHaveLength(3)
  expect(new Set(distractors).size, label).toBe(3)
  distractors.forEach((value) => {
    expect(value, label).not.toBe(question.correctAnswer)
    expect(Number.isInteger(value), label).toBe(true)
    expect(value, label).toBeGreaterThanOrEqual(0)
  })
}

describe('mistake helpers', () => {
  it('adds without carrying', () => {
    expect(addWithoutCarrying(27, 15)).toBe(32)
    expect(addWithoutCarrying(99, 1)).toBe(90)
    expect(addWithoutCarrying(5, 3)).toBe(8)
  })

  it('subtracts without borrowing', () => {
    expect(subtractWithoutBorrowing(42, 17)).toBe(35)
    expect(subtractWithoutBorrowing(100, 1)).toBe(101)
    expect(subtractWithoutBorrowing(58, 23)).toBe(35)
  })

  it('picks nearby numbers from small offsets, and also ±100 for big answers', () => {
    const offsets = (answer: number) => {
      const seen = new Set<number>()
      repeat(500, () => seen.add(nearbyNumber(answer) - answer))
      return [...seen].sort((a, b) => a - b)
    }

    expect(offsets(50)).toEqual([-10, -3, -2, -1, 1, 2, 3, 10])
    expect(offsets(500)).toEqual([-100, -10, -3, -2, -1, 1, 2, 3, 10, 100])
  })
})

describe('commonMistakes', () => {
  it('includes addition mistakes: forgetting to carry and subtracting instead', () => {
    expect(commonMistakes(makeQuestion(27, 'addition', 15))).toEqual(
      expect.arrayContaining([32, 12]),
    )
  })

  it('includes subtraction mistakes: not borrowing and adding instead', () => {
    expect(commonMistakes(makeQuestion(42, 'subtraction', 17))).toEqual(
      expect.arrayContaining([35, 59]),
    )
  })

  it('includes neighbouring times-table facts for multiplication', () => {
    expect(commonMistakes(makeQuestion(7, 'multiplication', 8))).toEqual(
      expect.arrayContaining([48, 64, 49, 63, 15]),
    )
  })

  it('includes the fact-family partner for division', () => {
    // 56 ÷ 7 = 8, and its partner fact 56 ÷ 8 = 7 gives the distractor 7.
    expect(commonMistakes(makeQuestion(56, 'division', 7))).toContain(7)
  })
})

describe('generateDistractors', () => {
  it.each(
    OPERATIONS.flatMap((operation) => LEVELS.map((difficulty) => [operation, difficulty] as const)),
  )('follows the rules for %s at %s', (operation, difficulty) => {
    repeat(300, () => {
      const question = generateQuestion(operation, difficulty)
      expectValidDistractors(question, generateDistractors(question))
    })
  })

  it('keeps distractors plausible: common mistakes or numbers near the answer', () => {
    const question = makeQuestion(7, 'multiplication', 8)
    const mistakes = commonMistakes(question)

    repeat(300, () => {
      generateDistractors(question).forEach((value) => {
        const isNearby = Math.abs(value - question.correctAnswer) <= 10
        expect(isNearby || mistakes.includes(value), `${value}`).toBe(true)
      })
    })
  })

  it('uses at most two common mistakes, leaving room for a nearby number', () => {
    const question = makeQuestion(7, 'multiplication', 8)
    const nearby = [46, 53, 54, 55, 57, 58, 59, 66]

    repeat(300, () => {
      expect(generateDistractors(question).some((value) => nearby.includes(value))).toBe(true)
    })
  })

  it.each([
    ['an answer of 0', makeQuestion(5, 'subtraction', 5)],
    ['an answer of 0 with no borrowing mistake', makeQuestion(1, 'subtraction', 1)],
    ['an answer of 1', makeQuestion(2, 'subtraction', 1)],
    ['1 × 1', makeQuestion(1, 'multiplication', 1)],
    ['1 ÷ 1 (dividing by 0 would be a neighbour)', makeQuestion(1, 'division', 1)],
    ['5 ÷ 5', makeQuestion(5, 'division', 5)],
    ['a large answer', makeQuestion(999, 'subtraction', 100)],
  ])('handles %s', (_, question) => {
    repeat(300, () => expectValidDistractors(question, generateDistractors(question)))
  })

  it('never returns fractions, even when dividing by a neighbour does not divide evenly', () => {
    // 56 ÷ 6 and 56 ÷ 8 are both mistakes to consider; 56 ÷ 6 is not a whole number.
    const question = makeQuestion(56, 'division', 7)
    repeat(300, () => {
      generateDistractors(question).forEach((value) => expect(Number.isInteger(value)).toBe(true))
    })
  })

  it('stops retrying and still finishes when nearby numbers keep getting rejected', () => {
    // A random source of 0 always picks the -10 offset, which is negative for an answer of 0.
    // Mistakes give 2 (1 + 1); then counting up from 0 fills in 1 and 3.
    const question = makeQuestion(1, 'subtraction', 1)

    expect(generateDistractors(question, () => 0)).toEqual([2, 1, 3])
  })

  it('allows negative distractors only when asked', () => {
    const question = makeQuestion(3, 'subtraction', 3)
    let sawNegative = false

    repeat(300, () => {
      const distractors = generateDistractors(question, Math.random, { allowNegative: true })
      expect(new Set(distractors).size).toBe(3)
      if (distractors.some((value) => value < 0)) sawNegative = true
    })

    expect(sawNegative).toBe(true)
  })
})
