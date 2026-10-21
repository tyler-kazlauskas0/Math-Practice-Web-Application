import { OPERATION_OPTIONS } from '../data/practiceOptions'
import type { Question } from '../types/question'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import { isPracticeConfig } from './practiceConfig'
import type { AttemptStatistics, SessionSummary } from '../types/statistics'

function summarizeAttempts(attempts: PracticeAttempt[]): AttemptStatistics {
  const totalAttempts = attempts.length
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length
  const totalTime = attempts.reduce((sum, attempt) => sum + attempt.timeTakenMs, 0)

  return {
    totalAttempts,
    correctAttempts,
    accuracy: totalAttempts === 0 ? 0 : correctAttempts / totalAttempts,
    averageTimeMs: totalAttempts === 0 ? 0 : Math.round(totalTime / totalAttempts),
  }
}

/** The questions marked wrong, once each, in the order they were asked. */
export function collectMistakes(attempts: PracticeAttempt[]): Question[] {
  const seen = new Set<string>()
  return attempts
    .filter((attempt) => !attempt.isCorrect)
    .map((attempt) => attempt.question)
    .filter((question) => {
      if (seen.has(question.displayText)) return false
      seen.add(question.displayText)
      return true
    })
}

/** Builds the summary shown when a session ends. */
export function createSessionSummary(
  session: PracticeSession,
  { isReview = false }: { isReview?: boolean } = {},
): SessionSummary {
  const overall = summarizeAttempts(session.attempts)
  const byOperation = OPERATION_OPTIONS.map(({ value: operation }) => ({
    operation,
    ...summarizeAttempts(session.attempts.filter((a) => a.question.operation === operation)),
  })).filter((stats) => stats.totalAttempts > 0)

  return {
    ...overall,
    sessionId: session.id,
    config: session.config,
    incorrectAttempts: overall.totalAttempts - overall.correctAttempts,
    byOperation,
    mistakes: collectMistakes(session.attempts),
    isReview,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? new Date().toISOString(),
  }
}

/** Checks that navigation state looks like a session summary (e.g. not missing after a bookmark). */
export function isSessionSummary(value: unknown): value is SessionSummary {
  if (typeof value !== 'object' || value === null) return false
  const summary = value as Record<string, unknown>
  return (
    typeof summary.sessionId === 'string' &&
    typeof summary.totalAttempts === 'number' &&
    typeof summary.correctAttempts === 'number' &&
    typeof summary.incorrectAttempts === 'number' &&
    typeof summary.accuracy === 'number' &&
    Array.isArray(summary.byOperation) &&
    Array.isArray(summary.mistakes) &&
    isPracticeConfig(summary.config)
  )
}
