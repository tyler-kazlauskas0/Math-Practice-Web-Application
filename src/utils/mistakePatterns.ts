import type { MistakePattern } from '../types/mistake'
import type { Question } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import { OPERATION_OPTIONS } from '../data/practiceOptions'
import { formatQuestion } from './questions/formatQuestion'
import { isValidQuestion } from './questions/validateQuestion'

/** How many of a pattern's most recent wrong answers are kept. */
export const MAX_SAVED_WRONG_ANSWERS = 5

/** Related questions answered correctly in a row needed to master a mistake, unless changed in Settings. */
export const DEFAULT_MASTERY_THRESHOLD = 3

/** The thresholds the Settings page offers. */
export const MASTERY_THRESHOLD_OPTIONS = [2, 3, 4, 5] as const

export const isMasteryThreshold = (value: unknown): value is number =>
  MASTERY_THRESHOLD_OPTIONS.includes(value as (typeof MASTERY_THRESHOLD_OPTIONS)[number])

/** Mastered patterns are left out of mistake review until the fact is missed again. */
export const isMastered = (pattern: MistakePattern) => pattern.masteredAt !== null

/** Whether an answer was to a question related to a saved mistake. */
export const isMistakeReviewAttempt = (attempt: PracticeAttempt) =>
  attempt.question.source === 'mistake-review'

/** Patterns that still need review. */
export const activePatterns = (patterns: MistakePattern[]) =>
  patterns.filter((pattern) => !isMastered(pattern))

/** Operations where swapping the numbers gives the same fact (7 × 8 = 8 × 7). */
const ORDER_DOES_NOT_MATTER = new Set(['addition', 'multiplication'])

/** The pattern key for a question, e.g. `multiplication:7:8` for both `7 × 8` and `8 × 7`. */
export function patternKey(question: Pick<Question, 'operation' | 'leftOperand' | 'rightOperand'>) {
  const { operation, leftOperand: a, rightOperand: b } = question
  const [first, second] = ORDER_DOES_NOT_MATTER.has(operation) && a > b ? [b, a] : [a, b]
  return `${operation}:${first}:${second}`
}

/** A new pattern for the first mistake on a fact. */
export function createMistakePattern(attempt: PracticeAttempt): MistakePattern {
  const { question } = attempt
  return {
    key: patternKey(question),
    operation: question.operation,
    leftOperand: question.leftOperand,
    rightOperand: question.rightOperand,
    correctAnswer: question.correctAnswer,
    difficulty: question.difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    incorrectAnswers: [attempt.userAnswer],
    firstIncorrectAt: attempt.answeredAt,
    lastIncorrectAt: attempt.answeredAt,
    masteredAt: null,
  }
}

/**
 * Adds another mistake to an existing pattern. Mastery progress goes back to 0, and a
 * mastered pattern returns to review, since the player has just shown they don't know it yet.
 */
export function updateMistakePattern(
  pattern: MistakePattern,
  attempt: PracticeAttempt,
): MistakePattern {
  return {
    ...pattern,
    difficulty: attempt.question.difficulty,
    incorrectCount: pattern.incorrectCount + 1,
    similarCorrectCount: 0,
    masteredAt: null,
    incorrectAnswers: [...pattern.incorrectAnswers, attempt.userAnswer].slice(
      -MAX_SAVED_WRONG_ANSWERS,
    ),
    // Keep the latest time, even if attempts arrive out of order.
    lastIncorrectAt:
      attempt.answeredAt > pattern.lastIncorrectAt ? attempt.answeredAt : pattern.lastIncorrectAt,
  }
}

/**
 * Returns the patterns updated for one attempt: a wrong answer updates the fact's existing
 * pattern or adds a new one. Right answers leave the patterns unchanged.
 */
export function recordMistake(
  patterns: MistakePattern[],
  attempt: PracticeAttempt,
): MistakePattern[] {
  if (attempt.isCorrect) return patterns
  const key = patternKey(attempt.question)
  const existing = patterns.find((pattern) => pattern.key === key)
  return existing
    ? patterns.map((pattern) =>
        pattern === existing ? updateMistakePattern(pattern, attempt) : pattern,
      )
    : [...patterns, createMistakePattern(attempt)]
}

/**
 * A related review question answered correctly: one step closer to mastery. Reaching
 * `threshold` marks the pattern as mastered.
 */
export function recordReviewSuccess(
  pattern: MistakePattern,
  answeredAt: string,
  threshold: number,
): MistakePattern {
  const similarCorrectCount = pattern.similarCorrectCount + 1
  const justMastered = !isMastered(pattern) && similarCorrectCount >= threshold
  return {
    ...pattern,
    similarCorrectCount,
    masteredAt: justMastered ? answeredAt : pattern.masteredAt,
  }
}

/**
 * A related review question answered incorrectly: counts as another mistake on the original
 * fact. Progress resets and the pattern returns to review. The wrong answer isn't added to
 * `incorrectAnswers`, since it was an answer to a different question.
 */
export function recordReviewMiss(pattern: MistakePattern, answeredAt: string): MistakePattern {
  return {
    ...pattern,
    incorrectCount: pattern.incorrectCount + 1,
    similarCorrectCount: 0,
    masteredAt: null,
    lastIncorrectAt: answeredAt > pattern.lastIncorrectAt ? answeredAt : pattern.lastIncorrectAt,
  }
}

/**
 * Updates the patterns for any attempt. A mistake-review question updates the pattern it was
 * made from (right or wrong); any other wrong answer is recorded with `recordMistake`.
 */
export function applyAttempt(
  patterns: MistakePattern[],
  attempt: PracticeAttempt,
  threshold: number,
): MistakePattern[] {
  const { source, mistakePatternId } = attempt.question
  if (source === 'mistake-review' && mistakePatternId) {
    const original = patterns.find((pattern) => pattern.key === mistakePatternId)
    // If the pattern was deleted meanwhile, treat a miss like any other mistake.
    if (!original) return recordMistake(patterns, attempt)
    const updated = attempt.isCorrect
      ? recordReviewSuccess(original, attempt.answeredAt, threshold)
      : recordReviewMiss(original, attempt.answeredAt)
    return patterns.map((pattern) => (pattern === original ? updated : pattern))
  }
  return recordMistake(patterns, attempt)
}

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0
const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))

/** Checks a saved pattern: a valid math fact with sensible counts, dates, and a matching key. */
export function isMistakePattern(value: unknown): value is MistakePattern {
  if (typeof value !== 'object' || value === null) return false
  const pattern = value as Record<string, unknown>
  if (!OPERATION_OPTIONS.some((option) => option.value === pattern.operation)) return false

  // Check the fact itself with the same rules as generated questions.
  const asQuestion = {
    id: 'check',
    operation: pattern.operation,
    difficulty: pattern.difficulty,
    leftOperand: pattern.leftOperand,
    rightOperand: pattern.rightOperand,
    correctAnswer: pattern.correctAnswer,
  } as Omit<Question, 'displayText'>
  const displayText = formatQuestion(
    asQuestion.leftOperand,
    asQuestion.operation,
    asQuestion.rightOperand,
  )

  return (
    isValidQuestion({ ...asQuestion, displayText }) &&
    pattern.key === patternKey(asQuestion) &&
    isCount(pattern.incorrectCount) &&
    pattern.incorrectCount >= 1 &&
    isCount(pattern.similarCorrectCount) &&
    Array.isArray(pattern.incorrectAnswers) &&
    pattern.incorrectAnswers.every((answer) => Number.isFinite(answer)) &&
    isDateString(pattern.firstIncorrectAt) &&
    isDateString(pattern.lastIncorrectAt) &&
    (pattern.masteredAt === null || isDateString(pattern.masteredAt))
  )
}

/** Reads saved patterns, skipping invalid records and merging any duplicates of the same fact. */
export function parseMistakePatterns(data: unknown): MistakePattern[] {
  if (!Array.isArray(data)) return []
  const byKey = new Map<string, MistakePattern>()
  // Patterns saved before mastery existed have no `masteredAt`: they still need review.
  const withMastery = data.map((item) =>
    typeof item === 'object' && item !== null && !('masteredAt' in item)
      ? { ...item, masteredAt: null }
      : item,
  )
  for (const pattern of withMastery.filter(isMistakePattern)) {
    const duplicate = byKey.get(pattern.key)
    byKey.set(pattern.key, duplicate ? mergePatterns(duplicate, pattern) : pattern)
  }
  return [...byKey.values()]
}

function mergePatterns(a: MistakePattern, b: MistakePattern): MistakePattern {
  const [older, newer] = a.lastIncorrectAt <= b.lastIncorrectAt ? [a, b] : [b, a]
  return {
    ...newer,
    leftOperand: older.leftOperand,
    rightOperand: older.rightOperand,
    incorrectCount: a.incorrectCount + b.incorrectCount,
    incorrectAnswers: [...older.incorrectAnswers, ...newer.incorrectAnswers].slice(
      -MAX_SAVED_WRONG_ANSWERS,
    ),
    firstIncorrectAt:
      a.firstIncorrectAt < b.firstIncorrectAt ? a.firstIncorrectAt : b.firstIncorrectAt,
  }
}
