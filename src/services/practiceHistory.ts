import type { PracticeAttempt, PracticeConfig, PracticeSessionState } from '../types/session'
import { isPracticeConfig } from '../utils/practiceConfig'
import { isValidQuestion } from '../utils/questions/validateQuestion'
import { migrateStorage } from './schema'
import { readJson, writeJson, type WriteResult } from './storage'

export const SESSIONS_KEY = 'sessions'
export const ATTEMPTS_KEY = 'attempts'
export const ARCHIVE_KEY = 'history-archive'

/** Sessions kept in full. Older ones are folded into the archive totals. */
export const MAX_STORED_SESSIONS = 100
/** Attempts kept in full. A safety limit in case of very long non-stop sessions. */
export const MAX_STORED_ATTEMPTS = 5000

/** One saved practice session, without its attempts (those are saved separately). */
export interface StoredSession {
  id: string
  config: PracticeConfig
  isReview: boolean
  startedAt: string
  /** `null` if the session was never finished, e.g. the browser was closed mid-session. */
  completedAt: string | null
  totalAttempts: number
  correctAttempts: number
}

/** One saved answer. `userAnswer` is the selected answer and `isCorrect` the self-reported result. */
export interface StoredAttempt extends PracticeAttempt {
  sessionId: string
}

/** Running totals for sessions too old to keep in full. */
export interface HistoryArchive {
  sessionCount: number
  totalAttempts: number
  correctAttempts: number
}

const EMPTY_ARCHIVE: HistoryArchive = { sessionCount: 0, totalAttempts: 0, correctAttempts: 0 }

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0
const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))

export function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false
  const session = value as Record<string, unknown>
  return (
    typeof session.id === 'string' &&
    isPracticeConfig(session.config) &&
    typeof session.isReview === 'boolean' &&
    isDateString(session.startedAt) &&
    (session.completedAt === null || isDateString(session.completedAt)) &&
    isCount(session.totalAttempts) &&
    isCount(session.correctAttempts) &&
    session.correctAttempts <= session.totalAttempts
  )
}

export function isStoredAttempt(value: unknown): value is StoredAttempt {
  if (typeof value !== 'object' || value === null) return false
  const attempt = value as Record<string, unknown>
  return (
    typeof attempt.sessionId === 'string' &&
    typeof attempt.question === 'object' &&
    attempt.question !== null &&
    isValidQuestion(attempt.question as StoredAttempt['question']) &&
    typeof attempt.userAnswer === 'number' &&
    Number.isFinite(attempt.userAnswer) &&
    typeof attempt.isCorrect === 'boolean' &&
    isCount(attempt.timeTakenMs) &&
    isDateString(attempt.answeredAt)
  )
}

/** Reads a saved list, keeping the valid entries. One bad record doesn't lose the rest. */
function readList<T>(key: string, isItem: (value: unknown) => value is T): T[] {
  const saved = readJson(key, (data) => (Array.isArray(data) ? data : null))
  return saved.status === 'ok' ? saved.value.filter(isItem) : []
}

function readArchive(): HistoryArchive {
  const saved = readJson(ARCHIVE_KEY, (data) => {
    const archive = data as HistoryArchive | null
    return archive &&
      isCount(archive.sessionCount) &&
      isCount(archive.totalAttempts) &&
      isCount(archive.correctAttempts)
      ? archive
      : null
  })
  return saved.status === 'ok' ? saved.value : EMPTY_ARCHIVE
}

/** Saves a list; if storage is full, keeps only the newest half and tries once more. */
function writeList<T>(name: string, items: T[]): WriteResult {
  const result = writeJson(name, items)
  if (result.ok || result.reason !== 'quota-exceeded') return result
  return writeJson(name, items.slice(Math.floor(items.length / 2)))
}

const byStartTime = (a: StoredSession, b: StoredSession) => a.startedAt.localeCompare(b.startedAt)

/** Turns the live session state into the record that is saved. */
export function toStoredSession(state: PracticeSessionState): StoredSession {
  return {
    id: state.id,
    config: state.config,
    isReview: state.reviewQuestions !== null,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    totalAttempts: state.attempts.length,
    correctAttempts: state.correctCount,
  }
}

/**
 * Saves (or updates) a session. When there are more than `MAX_STORED_SESSIONS`, the oldest
 * are removed along with their attempts, and their totals are added to the archive.
 */
export function saveSession(session: StoredSession): WriteResult {
  migrateStorage()
  const sessions = readList(SESSIONS_KEY, isStoredSession).filter((s) => s.id !== session.id)
  sessions.push(session)
  sessions.sort(byStartTime)

  const evicted = sessions.splice(0, Math.max(0, sessions.length - MAX_STORED_SESSIONS))
  if (evicted.length > 0) {
    const archive = readArchive()
    writeJson(ARCHIVE_KEY, {
      sessionCount: archive.sessionCount + evicted.length,
      totalAttempts: archive.totalAttempts + evicted.reduce((n, s) => n + s.totalAttempts, 0),
      correctAttempts: archive.correctAttempts + evicted.reduce((n, s) => n + s.correctAttempts, 0),
    })
    const evictedIds = new Set(evicted.map((s) => s.id))
    writeList(
      ATTEMPTS_KEY,
      readList(ATTEMPTS_KEY, isStoredAttempt).filter((a) => !evictedIds.has(a.sessionId)),
    )
  }

  return writeList(SESSIONS_KEY, sessions)
}

/** Saves one completed attempt. Saving the same attempt twice has no effect. */
export function saveAttempt(attempt: StoredAttempt): WriteResult {
  migrateStorage()
  const attempts = readList(ATTEMPTS_KEY, isStoredAttempt)
  const isDuplicate = attempts.some(
    (saved) => saved.sessionId === attempt.sessionId && saved.question.id === attempt.question.id,
  )
  if (isDuplicate) return { ok: true }

  attempts.push(attempt)
  return writeList(ATTEMPTS_KEY, attempts.slice(-MAX_STORED_ATTEMPTS))
}

/** The most recent sessions, newest first. */
export function loadRecentSessions(limit = 10): StoredSession[] {
  migrateStorage()
  return readList(SESSIONS_KEY, isStoredSession).sort(byStartTime).reverse().slice(0, limit)
}

/** Every saved attempt, oldest first. Pass a session ID to get only that session's attempts. */
export function loadAttempts(sessionId?: string): StoredAttempt[] {
  migrateStorage()
  const attempts = readList(ATTEMPTS_KEY, isStoredAttempt)
  return sessionId === undefined ? attempts : attempts.filter((a) => a.sessionId === sessionId)
}

/** Totals for sessions too old to be kept in full. */
export function loadArchive(): HistoryArchive {
  migrateStorage()
  return readArchive()
}
