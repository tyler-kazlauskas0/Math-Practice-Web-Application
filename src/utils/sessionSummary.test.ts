import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import { collectMistakes, createSessionSummary, isSessionSummary } from './sessionSummary'

const attempt = (
  operation: 'addition' | 'division',
  isCorrect: boolean,
  timeTakenMs: number,
): PracticeAttempt => ({
  question:
    operation === 'addition' ? makeQuestion(2, 'addition', 3) : makeQuestion(8, 'division', 2),
  userAnswer: 5,
  isCorrect,
  timeTakenMs,
  answeredAt: '2026-10-21T10:00:00.000Z',
})

const session: PracticeSession = {
  id: 'session-1',
  config: { operations: ['addition', 'division'], difficulty: 'easy', sessionLength: 5 },
  attempts: [
    attempt('addition', true, 1000),
    attempt('addition', false, 3000),
    attempt('division', true, 2000),
  ],
  startedAt: '2026-10-21T10:00:00.000Z',
  completedAt: '2026-10-21T10:05:00.000Z',
}

describe('createSessionSummary', () => {
  it('totals the attempts', () => {
    expect(createSessionSummary(session)).toMatchObject({
      sessionId: 'session-1',
      totalAttempts: 3,
      correctAttempts: 2,
      incorrectAttempts: 1,
      accuracy: 2 / 3,
      averageTimeMs: 2000,
      completedAt: '2026-10-21T10:05:00.000Z',
    })
  })

  it('breaks results down by the operations that were asked', () => {
    expect(createSessionSummary(session).byOperation).toEqual([
      {
        operation: 'addition',
        totalAttempts: 2,
        correctAttempts: 1,
        incorrectAttempts: 1,
        accuracy: 0.5,
        averageTimeMs: 2000,
      },
      {
        operation: 'division',
        totalAttempts: 1,
        correctAttempts: 1,
        incorrectAttempts: 0,
        accuracy: 1,
        averageTimeMs: 2000,
      },
    ])
  })

  it('handles a session with no answers', () => {
    expect(createSessionSummary({ ...session, attempts: [] })).toMatchObject({
      totalAttempts: 0,
      accuracy: 0,
      averageTimeMs: 0,
      byOperation: [],
    })
  })
})

describe('collectMistakes', () => {
  it('lists each question marked wrong once, in the order asked', () => {
    const mistakes = collectMistakes([
      attempt('division', false, 1000),
      attempt('addition', true, 1000),
      attempt('addition', false, 1000),
      attempt('division', false, 1000),
    ])

    expect(mistakes.map((question) => question.displayText)).toEqual(['8 ÷ 2', '2 + 3'])
  })

  it('is included in the summary, along with whether it was a review', () => {
    const summary = createSessionSummary(session, { isReview: true })

    expect(summary.mistakes.map((question) => question.displayText)).toEqual(['2 + 3'])
    expect(summary.isReview).toBe(true)
    expect(createSessionSummary(session).isReview).toBe(false)
  })
})

describe('isSessionSummary', () => {
  it('accepts a summary and rejects anything else', () => {
    expect(isSessionSummary(createSessionSummary(session))).toBe(true)
    expect(isSessionSummary(null)).toBe(false)
    expect(isSessionSummary({ sessionId: 'x' })).toBe(false)
  })
})
