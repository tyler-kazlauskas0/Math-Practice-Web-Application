import { OPERATION_OPTIONS } from '../data/practiceOptions'
import type { Question } from '../types/question'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import { isPracticeConfig } from './practiceConfig'
import { tallyAttempts } from './statistics'
import type { SessionSummary } from '../types/statistics'

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
  { isReview = false, masteredCount = 0 }: { isReview?: boolean; masteredCount?: number } = {},
): SessionSummary {
  const reviewAttempts = session.attempts.filter(
    (attempt) => attempt.question.source === 'mistake-review',
  )

  const overall = tallyAttempts(session.attempts)
  const byOperation = OPERATION_OPTIONS.map(({ value: operation }) => ({
    operation,
    ...tallyAttempts(session.attempts.filter((a) => a.question.operation === operation)),
  })).filter((stats) => stats.totalAttempts > 0)

  return {
    ...overall,
    sessionId: session.id,
    config: session.config,
    byOperation,
    mistakes: collectMistakes(session.attempts),
    isReview,
    mistakeReview:
      reviewAttempts.length === 0
        ? null
        : {
            questions: reviewAttempts.length,
            correct: reviewAttempts.filter((attempt) => attempt.isCorrect).length,
            patternsPracticed: new Set(
              reviewAttempts.map((attempt) => attempt.question.mistakePatternId),
            ).size,
            mastered: masteredCount,
          },
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
