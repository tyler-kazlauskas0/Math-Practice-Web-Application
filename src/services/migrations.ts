import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../data/practiceOptions'
import type { PracticeAttempt } from '../types/session'
import { recordMistake } from '../utils/mistakePatterns'
import { isValidQuestion } from '../utils/questions/validateQuestion'
import { readJson, writeJson } from './storage'

/** Zero counts for every operation or difficulty, e.g. `{ addition: {...}, subtraction: {...} }`. */
export function emptyTallies<K extends string>(keys: readonly K[]) {
  return Object.fromEntries(
    keys.map((key) => [key, { totalAttempts: 0, correctAttempts: 0 }]),
  ) as Record<K, { totalAttempts: number; correctAttempts: number }>
}

export const operationKeys = OPERATION_OPTIONS.map((option) => option.value)
export const difficultyKeys = DIFFICULTY_OPTIONS.map((option) => option.value)

/**
 * Version 1 → 2: the history archive gains per-operation and per-difficulty counts. Old
 * archives keep their overall totals; their breakdown starts at zero, since it was never saved.
 */
export function addArchiveBreakdowns(): void {
  const saved = readJson('history-archive', (data) =>
    typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null,
  )
  if (saved.status !== 'ok' || 'byOperation' in saved.value) return

  writeJson('history-archive', {
    ...saved.value,
    byOperation: emptyTallies(operationKeys),
    byDifficulty: emptyTallies(difficultyKeys),
  })
}

/**
 * Version 2 → 3: mistake patterns are added. They are built from the wrong answers already
 * saved, so mistakes made before this version aren't lost. Existing patterns are left alone.
 */
export function buildMistakePatternsFromAttempts(): void {
  if (readJson('mistake-patterns', (data) => data).status !== 'missing') return
  const saved = readJson('attempts', (data) => (Array.isArray(data) ? data : null))
  if (saved.status !== 'ok') return

  const wrongAnswers = saved.value
    .filter(
      (attempt): attempt is PracticeAttempt =>
        typeof attempt === 'object' &&
        attempt !== null &&
        attempt.isCorrect === false &&
        typeof attempt.userAnswer === 'number' &&
        typeof attempt.answeredAt === 'string' &&
        typeof attempt.question === 'object' &&
        attempt.question !== null &&
        isValidQuestion(attempt.question),
    )
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))
  if (wrongAnswers.length === 0) return

  writeJson('mistake-patterns', wrongAnswers.reduce(recordMistake, []))
}
