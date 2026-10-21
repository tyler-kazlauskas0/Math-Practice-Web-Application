import { describe, expect, it, vi } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import type { PracticeConfig, PracticeRound, PracticeSessionState } from '../types/session'
import {
  createNextRound,
  isOnLastQuestion,
  practiceSessionReducer,
  startSession,
} from './practiceSession'

const config: PracticeConfig = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }
const round = (left: number, right: number): PracticeRound => ({
  question: { ...makeQuestion(left, 'addition', right), id: `${left}+${right}` },
  choices: [left + right, 1, 2, 3],
})

const record = (state: PracticeSessionState, markedCorrect = true) =>
  practiceSessionReducer(state, {
    type: 'recordResult',
    selectedAnswer: 5,
    markedCorrect,
    timeTakenMs: 1500,
    now: 2000,
  })
const next = (state: PracticeSessionState, nextRound: PracticeRound | null = round(4, 4)) =>
  practiceSessionReducer(state, { type: 'nextQuestion', round: nextRound, now: 3000 })

describe('startSession', () => {
  it('stores the session id, config, first question, and starting totals', () => {
    const state = startSession(config, round(2, 3), 1000)

    expect(state).toMatchObject({
      config,
      currentQuestionIndex: 0,
      correctCount: 0,
      incorrectCount: 0,
      attempts: [],
      isActive: true,
      questionShownAt: 1000,
      startedAt: new Date(1000).toISOString(),
      completedAt: null,
    })
    expect(state.id).toEqual(expect.any(String))
    expect(state.currentRound?.question.displayText).toBe('2 + 3')
  })

  it('is not active if the first question could not be made', () => {
    expect(startSession(config, null, 1000).isActive).toBe(false)
  })
})

describe('practiceSessionReducer', () => {
  it('records a right answer as a completed attempt', () => {
    const state = record(startSession(config, round(2, 3), 1000), true)

    expect(state.correctCount).toBe(1)
    expect(state.incorrectCount).toBe(0)
    expect(state.attempts).toEqual([
      {
        question: round(2, 3).question,
        userAnswer: 5,
        isCorrect: true,
        timeTakenMs: 1500,
        answeredAt: new Date(2000).toISOString(),
      },
    ])
  })

  it('records a wrong answer', () => {
    const state = record(startSession(config, round(2, 3), 1000), false)

    expect(state.correctCount).toBe(0)
    expect(state.incorrectCount).toBe(1)
    expect(state.attempts[0].isCorrect).toBe(false)
  })

  it('records only one result per question', () => {
    const once = record(startSession(config, round(2, 3), 1000), true)
    const twice = record(once, false)

    expect(twice).toBe(once)
    expect(twice.attempts).toHaveLength(1)
  })

  it('moves to the next question only after a result is recorded', () => {
    const start = startSession(config, round(2, 3), 1000)
    expect(next(start)).toBe(start)

    const advanced = next(record(start))
    expect(advanced.currentQuestionIndex).toBe(1)
    expect(advanced.currentRound?.question.displayText).toBe('4 + 4')
    expect(advanced.questionShownAt).toBe(3000)
  })

  it('ends after the last question of a fixed-length session', () => {
    let state = startSession(config, round(2, 3), 1000)
    for (let i = 0; i < 4; i++) state = next(record(state))
    expect(isOnLastQuestion(state)).toBe(true)
    expect(state.isActive).toBe(true)

    state = next(record(state))

    expect(state.isActive).toBe(false)
    expect(state.completedAt).toBe(new Date(3000).toISOString())
    expect(state.attempts).toHaveLength(5)
  })

  it('never runs out of questions in non-stop practice', () => {
    let state = startSession({ ...config, sessionLength: 'continuous' }, round(2, 3), 1000)
    for (let i = 0; i < 50; i++) state = next(record(state))

    expect(state.isActive).toBe(true)
    expect(state.currentQuestionIndex).toBe(50)
    expect(isOnLastQuestion(state)).toBe(false)
  })

  it('ends when asked, and ignores everything after that', () => {
    const ended = practiceSessionReducer(record(startSession(config, round(2, 3), 1000)), {
      type: 'endSession',
      now: 5000,
    })

    expect(ended.isActive).toBe(false)
    expect(ended.completedAt).toBe(new Date(5000).toISOString())
    expect(next(ended)).toBe(ended)
    expect(record(ended)).toBe(ended)
  })

  it('stops if the next question could not be made', () => {
    const state = next(record(startSession(config, round(2, 3), 1000)), null)

    expect(state.isActive).toBe(false)
    expect(state.currentRound).toBeNull()
  })
})

describe('createNextRound', () => {
  it('does not repeat the question just asked', () => {
    const makeRound = vi
      .fn<() => PracticeRound>()
      .mockReturnValueOnce(round(2, 3))
      .mockReturnValueOnce(round(2, 3))
      .mockReturnValueOnce(round(4, 1))

    expect(createNextRound(config, round(2, 3), makeRound).question.displayText).toBe('4 + 1')
    expect(makeRound).toHaveBeenCalledTimes(3)
  })

  it('gives up after a few tries when every question is the same', () => {
    const makeRound = vi.fn(() => round(1, 1))

    expect(createNextRound(config, round(1, 1), makeRound).question.displayText).toBe('1 + 1')
    expect(makeRound).toHaveBeenCalledTimes(10)
  })

  it('never repeats a question back-to-back over a real session', () => {
    let previous = createNextRound(config, null)
    for (let i = 0; i < 300; i++) {
      const current = createNextRound(config, previous)
      expect(current.question.displayText).not.toBe(previous.question.displayText)
      previous = current
    }
  })
})
