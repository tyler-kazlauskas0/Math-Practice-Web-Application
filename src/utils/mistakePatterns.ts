import type { MistakePattern } from '../types/mistake'
import type { Question } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import { OPERATION_OPTIONS } from '../data/practiceOptions'
import { formatQuestion } from './questions/formatQuestion'
import { isValidQuestion } from './questions/validateQuestion'

/** How many of a pattern's most recent wrong answers are kept. */
export const MAX_SAVED_WRONG_ANSWERS = 5

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
  }
}

/**
 * Adds another mistake to an existing pattern. Mastery progress goes back to 0, since the
 * player has just shown they don't know this fact yet.
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
    isDateString(pattern.lastIncorrectAt)
  )
}

/** Reads saved patterns, skipping invalid records and merging any duplicates of the same fact. */
export function parseMistakePatterns(data: unknown): MistakePattern[] {
  if (!Array.isArray(data)) return []
  const byKey = new Map<string, MistakePattern>()
  for (const pattern of data.filter(isMistakePattern)) {
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
