import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import {
  clearPracticeHistory,
  loadArchive,
  loadAttempts,
  loadRecentSessions,
  MAX_STORED_ATTEMPTS,
  MAX_STORED_SESSIONS,
  saveAttempt,
  saveSession,
  type StoredAttempt,
  type StoredSession,
} from './practiceHistory'

const session = (id: string, minute: number, overrides: Partial<StoredSession> = {}) =>
  ({
    id,
    config: { operations: ['addition'], difficulty: 'easy', sessionLength: 5 },
    isReview: false,
    startedAt: new Date(Date.UTC(2026, 9, 21, 10, minute)).toISOString(),
    completedAt: null,
    totalAttempts: 2,
    correctAttempts: 1,
    ...overrides,
  }) satisfies StoredSession

const attempt = (sessionId: string, questionId: string): StoredAttempt => ({
  sessionId,
  question: { ...makeQuestion(7, 'multiplication', 8), id: questionId },
  userAnswer: 54,
  isCorrect: false,
  timeTakenMs: 4200,
  answeredAt: '2026-10-21T10:00:05.000Z',
})

describe('practice sessions', () => {
  it('saves session details and completion, and updates them in place', () => {
    saveSession(session('s1', 0))
    saveSession(session('s1', 0, { completedAt: '2026-10-21T10:05:00.000Z', totalAttempts: 5 }))

    expect(loadRecentSessions()).toEqual([
      session('s1', 0, { completedAt: '2026-10-21T10:05:00.000Z', totalAttempts: 5 }),
    ])
  })

  it('loads recent sessions newest first, up to a limit', () => {
    saveSession(session('old', 1))
    saveSession(session('newest', 3))
    saveSession(session('middle', 2))

    expect(loadRecentSessions().map((s) => s.id)).toEqual(['newest', 'middle', 'old'])
    expect(loadRecentSessions(2).map((s) => s.id)).toEqual(['newest', 'middle'])
  })

  it('keeps only the newest sessions, adding the oldest to the archive totals', () => {
    for (let i = 0; i < MAX_STORED_SESSIONS + 3; i++) {
      saveSession(session(`s${i}`, i))
      saveAttempt(attempt(`s${i}`, `q${i}`))
    }

    expect(loadRecentSessions(1000)).toHaveLength(MAX_STORED_SESSIONS)
    expect(loadRecentSessions(1000).at(-1)?.id).toBe('s3')
    // Each removed session had one (wrong) multiplication attempt at Easy.
    expect(loadArchive()).toMatchObject({
      sessionCount: 3,
      totalAttempts: 3,
      correctAttempts: 0,
      byOperation: { multiplication: { totalAttempts: 3, correctAttempts: 0 } },
      byDifficulty: { easy: { totalAttempts: 3, correctAttempts: 0 } },
    })
    // The removed sessions' attempts go too.
    expect(loadAttempts('s0')).toEqual([])
    expect(loadAttempts('s3')).toHaveLength(1)
  })

  it('skips damaged records but keeps the rest', () => {
    localStorage.setItem(
      'math-practice:sessions',
      JSON.stringify([session('good', 0), { id: 'bad' }, 'junk']),
    )

    expect(loadRecentSessions().map((s) => s.id)).toEqual(['good'])
  })

  it('starts empty when the saved data is broken', () => {
    localStorage.setItem('math-practice:sessions', '{oops')
    localStorage.setItem('math-practice:attempts', '"not a list"')

    expect(loadRecentSessions()).toEqual([])
    expect(loadAttempts()).toEqual([])
  })
})

describe('practice attempts', () => {
  afterEach(() => vi.restoreAllMocks())

  it('saves every attempt with its answer, result, operation, difficulty, session, and time', () => {
    saveAttempt(attempt('s1', 'q1'))

    const [saved] = loadAttempts()
    expect(saved.userAnswer).toBe(54)
    expect(saved.isCorrect).toBe(false)
    expect(saved.question.operation).toBe('multiplication')
    expect(saved.question.difficulty).toBe('easy')
    expect(saved.sessionId).toBe('s1')
    expect(saved.answeredAt).toBe('2026-10-21T10:00:05.000Z')
  })

  it('ignores the same attempt saved twice', () => {
    saveAttempt(attempt('s1', 'q1'))
    saveAttempt(attempt('s1', 'q1'))
    saveAttempt(attempt('s1', 'q2'))

    expect(loadAttempts()).toHaveLength(2)
  })

  it('filters attempts by session', () => {
    saveAttempt(attempt('s1', 'q1'))
    saveAttempt(attempt('s2', 'q2'))

    expect(loadAttempts('s2').map((a) => a.question.id)).toEqual(['q2'])
  })

  it('keeps at most the newest attempts', () => {
    const many = Array.from({ length: MAX_STORED_ATTEMPTS }, (_, i) => attempt('s1', `q${i}`))
    localStorage.setItem('math-practice:attempts', JSON.stringify(many))

    saveAttempt(attempt('s1', 'newest'))

    const saved = loadAttempts()
    expect(saved).toHaveLength(MAX_STORED_ATTEMPTS)
    expect(saved[0].question.id).toBe('q1')
    expect(saved.at(-1)?.question.id).toBe('newest')
  })

  it('adds attempts removed by the limit to the archive totals', () => {
    const many = Array.from({ length: MAX_STORED_ATTEMPTS }, (_, i) => attempt('s1', `q${i}`))
    localStorage.setItem('math-practice:attempts', JSON.stringify(many))

    saveAttempt(attempt('s1', 'newest'))

    expect(loadArchive()).toMatchObject({
      sessionCount: 0,
      totalAttempts: 1,
      byOperation: { multiplication: { totalAttempts: 1, correctAttempts: 0 } },
    })
  })

  it('keeps the newest half when storage is full', () => {
    const existing = Array.from({ length: 9 }, (_, i) => attempt('s1', `q${i}`))
    localStorage.setItem('math-practice:attempts', JSON.stringify(existing))
    const original = Storage.prototype.setItem
    let attemptsWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      // The first write of the full list fails, as it would with a full storage.
      if (key === 'math-practice:attempts' && attemptsWrites++ === 0) {
        throw new DOMException('Full', 'QuotaExceededError')
      }
      original.call(this, key, value)
    })

    expect(saveAttempt(attempt('s1', 'newest'))).toEqual({ ok: true, isNew: true })
    expect(loadAttempts().map((a) => a.question.id)).toEqual(['q5', 'q6', 'q7', 'q8', 'newest'])
  })
})

describe('clearPracticeHistory', () => {
  it('deletes sessions, attempts, and archived totals, and nothing else', () => {
    localStorage.setItem('math-practice:settings', '{"animationsEnabled":false}')
    localStorage.setItem('other-app', 'keep me')
    for (let i = 0; i < MAX_STORED_SESSIONS + 1; i++) {
      saveSession(session(`s${i}`, i))
      saveAttempt(attempt(`s${i}`, `q${i}`))
    }
    expect(loadArchive().sessionCount).toBe(1)

    clearPracticeHistory()

    expect(loadRecentSessions()).toEqual([])
    expect(loadAttempts()).toEqual([])
    expect(loadArchive()).toMatchObject({ sessionCount: 0, totalAttempts: 0 })
    expect(localStorage.getItem('math-practice:settings')).toBe('{"animationsEnabled":false}')
    expect(localStorage.getItem('other-app')).toBe('keep me')
  })
})
