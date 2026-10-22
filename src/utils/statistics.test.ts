import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import { accuracyOf, bestStreak, calculateStatistics, tallyAttempts } from './statistics'

let minute = 0
function attempt(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  isCorrect: boolean,
  timeTakenMs = 2000,
): PracticeAttempt {
  const question = {
    addition: makeQuestion(2, 'addition', 3),
    subtraction: makeQuestion(9, 'subtraction', 4),
    multiplication: makeQuestion(7, 'multiplication', 8),
    division: makeQuestion(56, 'division', 7),
  }[operation]
  minute += 1
  return {
    question: { ...question, difficulty },
    userAnswer: 0,
    isCorrect,
    timeTakenMs,
    answeredAt: new Date(Date.UTC(2026, 9, 21, 10, minute)).toISOString(),
  }
}

describe('accuracyOf', () => {
  it('divides correct by total', () => {
    expect(accuracyOf(3, 4)).toBe(0.75)
  })

  it('returns 0 instead of dividing by zero', () => {
    expect(accuracyOf(0, 0)).toBe(0)
  })
})

describe('tallyAttempts', () => {
  it('counts attempted, right, and wrong, and works out accuracy and average time', () => {
    const stats = tallyAttempts([
      attempt('addition', 'easy', true, 1000),
      attempt('addition', 'easy', false, 3000),
      attempt('addition', 'easy', true, 2000),
    ])

    expect(stats).toEqual({
      totalAttempts: 3,
      correctAttempts: 2,
      incorrectAttempts: 1,
      accuracy: 2 / 3,
      averageTimeMs: 2000,
    })
  })

  it('handles no attempts without NaN', () => {
    expect(tallyAttempts([])).toEqual({
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: 0,
      averageTimeMs: 0,
    })
  })

  it('adds extra archived counts', () => {
    const stats = tallyAttempts([attempt('addition', 'easy', true)], {
      totalAttempts: 9,
      correctAttempts: 4,
    })

    expect(stats).toMatchObject({ totalAttempts: 10, correctAttempts: 5, incorrectAttempts: 5 })
    expect(stats.accuracy).toBe(0.5)
  })
})

describe('bestStreak', () => {
  it('finds the longest run of right answers in the order they were answered', () => {
    const answers = [true, true, false, true, true, true, false, true].map((right) =>
      attempt('addition', 'easy', right),
    )

    expect(bestStreak(answers.reverse())).toBe(3)
    expect(bestStreak([])).toBe(0)
  })
})

describe('calculateStatistics', () => {
  const attempts = [
    attempt('addition', 'beginner', true),
    attempt('addition', 'beginner', false),
    attempt('subtraction', 'easy', true),
    attempt('multiplication', 'intermediate', true),
    attempt('multiplication', 'intermediate', true),
    attempt('multiplication', 'advanced', false),
  ]

  it('works out the overall totals', () => {
    expect(calculateStatistics(attempts, 2)).toMatchObject({
      totalAttempts: 6,
      correctAttempts: 4,
      incorrectAttempts: 2,
      accuracy: 4 / 6,
      totalSessions: 2,
      bestStreak: 3,
    })
  })

  it('tracks each operation, including ones never practiced', () => {
    const { byOperation } = calculateStatistics(attempts, 2)

    expect(byOperation.addition).toMatchObject({
      totalAttempts: 2,
      correctAttempts: 1,
      incorrectAttempts: 1,
      accuracy: 0.5,
    })
    expect(byOperation.subtraction).toMatchObject({ totalAttempts: 1, accuracy: 1 })
    expect(byOperation.multiplication).toMatchObject({ totalAttempts: 3, correctAttempts: 2 })
    expect(byOperation.division).toMatchObject({ totalAttempts: 0, accuracy: 0 })
  })

  it('tracks each difficulty level', () => {
    const { byDifficulty } = calculateStatistics(attempts, 2)

    expect(byDifficulty.beginner).toMatchObject({ totalAttempts: 2, accuracy: 0.5 })
    expect(byDifficulty.easy).toMatchObject({ totalAttempts: 1, accuracy: 1 })
    expect(byDifficulty.intermediate).toMatchObject({ totalAttempts: 2, accuracy: 1 })
    expect(byDifficulty.advanced).toMatchObject({ totalAttempts: 1, accuracy: 0 })
  })

  it('includes archived totals from older sessions', () => {
    const tally = (totalAttempts: number, correctAttempts: number) => ({
      totalAttempts,
      correctAttempts,
    })
    const stats = calculateStatistics(attempts, 2, {
      sessionCount: 5,
      ...tally(40, 30),
      byOperation: {
        addition: tally(40, 30),
        subtraction: tally(0, 0),
        multiplication: tally(0, 0),
        division: tally(0, 0),
      },
      byDifficulty: {
        beginner: tally(40, 30),
        easy: tally(0, 0),
        intermediate: tally(0, 0),
        advanced: tally(0, 0),
      },
      streaks: { best: 0, trailing: 0 },
      review: tally(0, 0),
    })

    expect(stats).toMatchObject({ totalAttempts: 46, correctAttempts: 34, totalSessions: 7 })
    expect(stats.byOperation.addition).toMatchObject({ totalAttempts: 42, correctAttempts: 31 })
    expect(stats.byDifficulty.beginner).toMatchObject({ totalAttempts: 42 })
  })

  it('is all zeros for a new player', () => {
    const stats = calculateStatistics([], 0)

    expect(stats).toMatchObject({ totalAttempts: 0, accuracy: 0, totalSessions: 0, bestStreak: 0 })
    Object.values(stats.byOperation).forEach((op) => expect(op.accuracy).toBe(0))
  })
})
