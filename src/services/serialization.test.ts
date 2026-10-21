import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import { makePattern } from '../test/makePattern'
import { makeQuestion } from '../test/makeQuestion'
import { isMistakePattern } from '../utils/mistakePatterns'
import { createRound, startSession } from '../utils/practiceSession'
import type { PracticeConfig } from '../types/session'
import { loadActiveSession, parseActiveSession, saveActiveSession } from './activeSession'
import { loadMistakePatterns, saveMistakePatterns } from './mistakePatterns'
import {
  isHistoryArchive,
  isStoredAttempt,
  isStoredSession,
  loadAttempts,
  loadRecentSessions,
  saveAttempt,
  saveSession,
  type HistoryArchive,
  type StoredAttempt,
  type StoredSession,
} from './practiceHistory'
import { loadSettings, parseSettings, saveSettings } from './settingsStorage'

const session: StoredSession = {
  id: 's1',
  config: { operations: ['addition', 'division'], difficulty: 'easy', sessionLength: 10 },
  isReview: false,
  startedAt: '2026-10-21T10:00:00.000Z',
  completedAt: '2026-10-21T10:05:00.000Z',
  totalAttempts: 2,
  correctAttempts: 1,
}
const attempt: StoredAttempt = {
  sessionId: 's1',
  question: makeQuestion(56, 'division', 7),
  userAnswer: 9,
  isCorrect: false,
  timeTakenMs: 4200,
  answeredAt: '2026-10-21T10:01:00.000Z',
}
const tally = { totalAttempts: 3, correctAttempts: 2 }
const archive: HistoryArchive = {
  sessionCount: 1,
  ...tally,
  byOperation: { addition: tally, subtraction: tally, multiplication: tally, division: tally },
  byDifficulty: { beginner: tally, easy: tally, intermediate: tally, advanced: tally },
}
const pattern = makePattern(7, 'multiplication', 8, {
  similarCorrectCount: 2,
  incorrectAnswers: [54, 58],
})

/** The record with one field removed, and with that field set to the wrong kind of value. */
function brokenCopies(record: object): [string, unknown][] {
  return Object.keys(record).flatMap((field) => {
    const missing: Record<string, unknown> = { ...record }
    delete missing[field]
    return [
      [`without ${field}`, missing],
      [`with the wrong type of ${field}`, { ...record, [field]: { wrong: true } }],
    ] satisfies [string, unknown][]
  })
}

const newSession = (config: PracticeConfig) =>
  startSession(config, createRound(config), Date.parse('2026-10-21T10:00:00.000Z'))

/** Saved data always goes through JSON, so a round trip shows exactly what comes back. */
const throughJson = <T>(value: T): unknown => JSON.parse(JSON.stringify(value))

describe('saving and loading keeps every field exactly', () => {
  it('practice sessions and answers', () => {
    saveSession(session)
    saveAttempt(attempt)

    expect(loadRecentSessions()).toEqual([session])
    expect(loadAttempts()).toEqual([attempt])
  })

  it('settings', () => {
    const settings = { ...DEFAULT_SETTINGS, masteryThreshold: 5, animationsEnabled: false }
    saveSettings(settings)

    expect(loadSettings()).toEqual(settings)
  })

  it('mistake patterns', () => {
    saveMistakePatterns([pattern, makePattern(9, 'subtraction', 4, { masteredAt: null })])

    expect(loadMistakePatterns()).toEqual([pattern, makePattern(9, 'subtraction', 4)])
  })

  it('a session in progress, including its question and card', () => {
    const state = newSession({
      operations: ['multiplication'],
      difficulty: 'beginner',
      sessionLength: 5,
    })
    const saved = {
      locationKey: 'abc',
      session: state,
      card: {
        questionId: state.currentRound!.question.id,
        selectedAnswer: state.currentRound!.choices[2],
        isCardFlipped: true,
      },
    }
    saveActiveSession(saved)

    expect(loadActiveSession()).toEqual(saved)
  })
})

describe.each([
  ['practice session', session, isStoredSession],
  ['answer', attempt, isStoredAttempt],
  ['older statistics', archive, isHistoryArchive],
  ['mistake pattern', pattern, isMistakePattern],
] as const)('validating a saved %s', (_, record, isValid) => {
  it('accepts a good record after a JSON round trip', () => {
    expect(isValid(throughJson(record))).toBe(true)
  })

  it.each<[string, unknown]>([
    ['nothing', null],
    ['a number', 42],
    ['a list', [record]],
    ...brokenCopies(record),
  ])('rejects %s', (_, broken) => {
    expect(isValid(throughJson(broken))).toBe(false)
  })
})

describe('validating other saved data', () => {
  it('rejects impossible counts and dates', () => {
    expect(isStoredSession({ ...session, correctAttempts: 3 })).toBe(false)
    expect(isStoredSession({ ...session, totalAttempts: -1 })).toBe(false)
    expect(isStoredSession({ ...session, startedAt: 'yesterday' })).toBe(false)
    expect(isStoredAttempt({ ...attempt, timeTakenMs: 1.5 })).toBe(false)
    expect(isStoredAttempt({ ...attempt, question: makeQuestion(57, 'division', 7) })).toBe(false)
  })

  it('rejects a session in progress that could not be resumed', () => {
    const state = newSession({ operations: ['addition'], difficulty: 'easy', sessionLength: 5 })
    const good = { locationKey: 'abc', session: state, card: null }

    expect(parseActiveSession(throughJson(good))).toEqual(good)
    expect(parseActiveSession({ ...good, session: { ...state, isActive: false } })).toBeNull()
    expect(parseActiveSession({ ...good, session: { ...state, currentRound: null } })).toBeNull()
    expect(parseActiveSession({ ...good, locationKey: 7 })).toBeNull()
    expect(parseActiveSession('broken')).toBeNull()
  })

  it('falls back to defaults setting by setting', () => {
    expect(parseSettings(throughJson(DEFAULT_SETTINGS))).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings({ ...DEFAULT_SETTINGS, difficulty: 'impossible' })).toEqual(
      DEFAULT_SETTINGS,
    )
    expect(parseSettings('broken')).toEqual(DEFAULT_SETTINGS)
  })
})
