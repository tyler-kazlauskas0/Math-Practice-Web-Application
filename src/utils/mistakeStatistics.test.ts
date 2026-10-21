import { describe, expect, it } from 'vitest'
import { makePattern } from '../test/makePattern'
import { makeQuestion } from '../test/makeQuestion'
import type { PracticeAttempt } from '../types/session'
import {
  describeFact,
  mostMissedFacts,
  mostMissedOperations,
  sortByIncorrectCount,
  summarizeMistakes,
} from './mistakeStatistics'
import { calculateStatistics } from './statistics'

const attempt = (isCorrect: boolean, review: boolean): PracticeAttempt => ({
  question: {
    ...makeQuestion(56, 'division', 8),
    ...(review
      ? { source: 'mistake-review' as const, mistakePatternId: 'multiplication:7:8' }
      : {}),
  },
  userAnswer: 7,
  isCorrect,
  timeTakenMs: 1000,
  answeredAt: '2026-10-22T10:00:00.000Z',
})

describe('summarizeMistakes', () => {
  it('counts active and mastered mistakes and review questions', () => {
    const patterns = [
      makePattern(7, 'multiplication', 8),
      makePattern(9, 'subtraction', 4),
      makePattern(3, 'addition', 4, { masteredAt: '2026-10-22T10:00:00.000Z' }),
    ]
    const attempts = [
      attempt(true, true),
      attempt(false, true),
      attempt(true, true),
      attempt(true, false),
    ]

    expect(summarizeMistakes(patterns, attempts)).toEqual({
      activeCount: 2,
      masteredCount: 1,
      reviewQuestions: 3,
      reviewCorrect: 2,
    })
  })

  it('is all zeros with no mistakes', () => {
    expect(summarizeMistakes([], [])).toEqual({
      activeCount: 0,
      masteredCount: 0,
      reviewQuestions: 0,
      reviewCorrect: 0,
    })
  })
})

describe('mostMissedOperations', () => {
  const wrong = (left: number, operation: 'addition' | 'division', right: number) => ({
    question: makeQuestion(left, operation, right),
    userAnswer: 0,
    isCorrect: false,
    timeTakenMs: 1000,
    answeredAt: '2026-10-22T10:00:00.000Z',
  })

  it('finds the operation answered wrong most often', () => {
    const stats = calculateStatistics(
      [wrong(2, 'addition', 3), wrong(56, 'division', 7), wrong(48, 'division', 6)],
      1,
    )

    expect(mostMissedOperations(stats.byOperation)).toEqual(['division'])
  })

  it('returns every operation in a tie', () => {
    const stats = calculateStatistics([wrong(2, 'addition', 3), wrong(56, 'division', 7)], 1)

    expect(mostMissedOperations(stats.byOperation)).toEqual(['addition', 'division'])
  })

  it('returns nothing when no answers were wrong', () => {
    expect(mostMissedOperations(calculateStatistics([], 0).byOperation)).toEqual([])
  })
})

describe('sortByIncorrectCount', () => {
  it('puts the most-missed first', () => {
    const once = makePattern(3, 'addition', 4, { incorrectCount: 1 })
    const often = makePattern(7, 'multiplication', 8, { incorrectCount: 5 })
    const some = makePattern(9, 'subtraction', 4, { incorrectCount: 3 })

    expect(sortByIncorrectCount([once, often, some])).toEqual([often, some, once])
  })

  it('breaks ties by the most recent miss, then by the fact itself', () => {
    const older = makePattern(7, 'multiplication', 8, {
      incorrectCount: 2,
      lastIncorrectAt: '2026-10-20T10:00:00.000Z',
    })
    const newer = makePattern(6, 'multiplication', 8, {
      incorrectCount: 2,
      lastIncorrectAt: '2026-10-22T10:00:00.000Z',
    })
    const sameTimeA = makePattern(2, 'addition', 3, { incorrectCount: 2 })
    const sameTimeB = makePattern(10, 'addition', 3, { incorrectCount: 2 })

    expect(sortByIncorrectCount([older, sameTimeB, newer, sameTimeA])).toEqual([
      newer,
      sameTimeA,
      sameTimeB,
      older,
    ])
  })

  it('does not change the list it was given', () => {
    const patterns = [
      makePattern(3, 'addition', 4),
      makePattern(7, 'multiplication', 8, { incorrectCount: 4 }),
    ]
    const copy = [...patterns]

    sortByIncorrectCount(patterns)

    expect(patterns).toEqual(copy)
  })
})

describe('mostMissedFacts and describeFact', () => {
  it('lists the top facts as full number sentences', () => {
    const patterns = Array.from({ length: 8 }, (_, i) =>
      makePattern(i + 1, 'multiplication', 8, { incorrectCount: i + 1 }),
    )

    expect(mostMissedFacts(patterns).map(describeFact)).toEqual([
      '8 × 8 = 64',
      '7 × 8 = 56',
      '6 × 8 = 48',
      '5 × 8 = 40',
      '4 × 8 = 32',
    ])
  })
})
