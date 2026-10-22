import { afterEach, describe, expect, it, vi } from 'vitest'
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../data/practiceOptions'
import type { PracticeConfig } from '../types/session'
import { generateQuestion } from '../utils/questions/generateQuestion'
import { summarizeMistakes } from '../utils/mistakeStatistics'
import { bestStreak, calculateStatistics } from '../utils/statistics'
import {
  countStoredSessions,
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
import { getStorageUsage, TYPICAL_STORAGE_LIMIT } from './storage'

const OPERATIONS = OPERATION_OPTIONS.map((option) => option.value)
const LEVELS = DIFFICULTY_OPTIONS.map((option) => option.value)
const START = Date.parse('2026-01-01T09:00:00.000Z')

/** A realistic session of `count` answers, mixing every operation and level. */
function makeSession(index: number, count: number) {
  const startedAt = START + index * 3_600_000
  const config: PracticeConfig = {
    operations: OPERATIONS,
    difficulty: LEVELS[index % LEVELS.length],
    sessionLength: 'continuous',
  }
  const attempts: StoredAttempt[] = Array.from({ length: count }, (_, i) => ({
    sessionId: `session-${index}`,
    question: {
      ...generateQuestion(OPERATIONS[(index + i) % 4], config.difficulty),
      // Some sessions review mistakes.
      ...(index % 5 === 0 && { source: 'mistake-review' as const }),
    },
    userAnswer: 0,
    // Mostly short runs of right answers, plus one long run across sessions 78–82: it
    // starts in answers that get archived and carries on in ones kept in full.
    isCorrect: (index >= 78 && index <= 82) || (index * 7 + i) % 3 !== 0,
    timeTakenMs: 2000 + i,
    answeredAt: new Date(startedAt + (i + 1) * 5000).toISOString(),
  }))
  const session: StoredSession = {
    id: `session-${index}`,
    config,
    isReview: false,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date(startedAt + (count + 1) * 5000).toISOString(),
    totalAttempts: count,
    correctAttempts: attempts.filter((a) => a.isCorrect).length,
  }
  return { session, attempts }
}

/** Saves a session the way the app does: each answer as it's marked, then the session record. */
function playSession(index: number, count: number) {
  const { session, attempts } = makeSession(index, count)
  for (const attempt of attempts) {
    saveAttempt(attempt)
    saveSession({ ...session, completedAt: null })
  }
  saveSession(session)
  return attempts
}

/** Totals worked out directly from every answer ever given, to compare against. */
function expectedTotals(all: StoredAttempt[]) {
  const count = (list: StoredAttempt[]) => ({
    totalAttempts: list.length,
    correctAttempts: list.filter((a) => a.isCorrect).length,
  })
  return {
    ...count(all),
    byOperation: Object.fromEntries(
      OPERATIONS.map((op) => [op, count(all.filter((a) => a.question.operation === op))]),
    ),
    byDifficulty: Object.fromEntries(
      LEVELS.map((level) => [level, count(all.filter((a) => a.question.difficulty === level))]),
    ),
  }
}

describe('a large practice history', () => {
  afterEach(() => vi.restoreAllMocks())

  // 98 sessions of 51 answers (4,998) are saved directly, as if from months of practice; then
  // four more are played through the app's own saving, passing both limits.
  const SEEDED_SESSIONS = 98
  const PER_SESSION = 51

  function buildHistory() {
    const seeded = Array.from({ length: SEEDED_SESSIONS }, (_, i) => makeSession(i, PER_SESSION))
    localStorage.setItem('math-practice:schema-version', '3')
    localStorage.setItem('math-practice:sessions', JSON.stringify(seeded.map((s) => s.session)))
    localStorage.setItem(
      'math-practice:attempts',
      JSON.stringify(seeded.flatMap((s) => s.attempts)),
    )
    const played = [98, 99, 100, 101].flatMap((index) => playSession(index, 30))
    return [...seeded.flatMap((s) => s.attempts), ...played]
  }

  it('keeps only the newest detailed sessions and answers', () => {
    buildHistory()

    expect(countStoredSessions()).toBe(MAX_STORED_SESSIONS)
    expect(loadAttempts().length).toBeLessThanOrEqual(MAX_STORED_ATTEMPTS)
    expect(loadRecentSessions(1)[0].id).toBe('session-101')
    // Every kept answer belongs to a kept session.
    const kept = new Set(loadRecentSessions(MAX_STORED_SESSIONS).map((s) => s.id))
    expect(loadAttempts().every((a) => kept.has(a.sessionId))).toBe(true)
  })

  it('keeps every total exactly, by adding removed answers to the archive', () => {
    const everyAnswer = buildHistory()

    const statistics = calculateStatistics(loadAttempts(), countStoredSessions(), loadArchive())
    const expected = expectedTotals(everyAnswer)

    expect(statistics.totalSessions).toBe(SEEDED_SESSIONS + 4)
    expect(statistics.totalAttempts).toBe(expected.totalAttempts)
    expect(statistics.correctAttempts).toBe(expected.correctAttempts)
    for (const op of OPERATIONS) {
      expect(statistics.byOperation[op]).toMatchObject(expected.byOperation[op])
    }
    for (const level of LEVELS) {
      expect(statistics.byDifficulty[level]).toMatchObject(expected.byDifficulty[level])
    }
  })

  it('keeps the best streak, even one that runs across archived and kept answers', () => {
    const everyAnswer = buildHistory()
    const statistics = calculateStatistics(loadAttempts(), countStoredSessions(), loadArchive())

    // The long run really does cross over: it began in answers that are now archived.
    const kept = new Set(loadAttempts().map((a) => a.question.id))
    const longRun = everyAnswer.filter((a) => /^session-(7[89]|8[0-2])$/.test(a.sessionId))
    expect(longRun.some((a) => kept.has(a.question.id))).toBe(true)
    expect(longRun.some((a) => !kept.has(a.question.id))).toBe(true)

    expect(statistics.bestStreak).toBe(bestStreak(everyAnswer))
    expect(statistics.bestStreak).toBeGreaterThan(5 * PER_SESSION)
  })

  it('keeps mistake-review totals', () => {
    const everyAnswer = buildHistory()

    expect(summarizeMistakes([], loadAttempts(), loadArchive().review)).toMatchObject(
      summarizeMistakes([], everyAnswer),
    )
    expect(summarizeMistakes([], everyAnswer).reviewQuestions).toBeGreaterThan(1000)
  })

  it('stays well within what browsers allow to be saved', () => {
    buildHistory()
    const usage = getStorageUsage()

    // About 300 characters per detailed answer; everything else is small.
    expect(usage.byKey.attempts / loadAttempts().length).toBeLessThan(350)
    expect(usage.total).toBeLessThan(TYPICAL_STORAGE_LIMIT * 0.4)
    expect(usage.byKey['history-archive']).toBeLessThan(1000)
  })

  it('rewrites only a limited amount of saved data for each answer', () => {
    buildHistory()
    const writes = vi.spyOn(Storage.prototype, 'setItem')
    playSession(200, 10)

    // Every answer rewrites the answers kept in full. On a slow phone, writing 1,000 of them
    // takes about 40 ms, and 5,000 about 160 ms (see docs/PERFORMANCE.md).
    const largest = Math.max(...writes.mock.calls.map(([, value]) => value.length))
    expect(largest).toBeLessThan(400_000)
  })

  it('notices changes made outside this page (e.g. in another tab) despite caching', () => {
    playSession(0, 3)
    expect(loadAttempts()).toHaveLength(3)

    // Another tab adds an answer and damages one.
    const saved = JSON.parse(localStorage.getItem('math-practice:attempts')!)
    saved.push({ ...saved[0], question: { ...saved[0].question, id: 'from-other-tab' } })
    saved[1] = 'damaged'
    localStorage.setItem('math-practice:attempts', JSON.stringify(saved))

    const attempts = loadAttempts()
    expect(attempts).toHaveLength(3)
    expect(attempts.at(-1)?.question.id).toBe('from-other-tab')
  })

  it('cannot be changed by changing a list it handed out', () => {
    playSession(0, 3)
    loadAttempts().pop()
    loadRecentSessions().pop()

    expect(loadAttempts()).toHaveLength(3)
    expect(loadRecentSessions()).toHaveLength(1)
  })
})
