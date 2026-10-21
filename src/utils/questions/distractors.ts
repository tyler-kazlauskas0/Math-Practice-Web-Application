import type { Question } from '../../types/question'
import { pickRandom, shuffle, type RandomSource } from '../random'

/** How many wrong answers each question gets. */
export const DISTRACTOR_COUNT = 3

/** At most this many distractors come from common mistakes, leaving room for nearby numbers. */
const MAX_MISTAKE_DISTRACTORS = 2

/** How many random nearby numbers to try before falling back to counting up from the answer. */
export const MAX_NEARBY_ATTEMPTS = 20

/** How far nearby distractors are from the answer. Bigger answers can also be off by 100. */
const SMALL_OFFSETS = [-10, -3, -2, -1, 1, 2, 3, 10]
const LARGE_OFFSETS = [...SMALL_OFFSETS, -100, 100]

export interface DistractorOptions {
  /** Allow wrong answers below zero. Off by default: no question in the app has a negative answer. */
  allowNegative?: boolean
}

/** Splits a number into its digits, ones first: 472 → [2, 7, 4]. */
function toDigits(value: number): number[] {
  const digits: number[] = []
  let rest = Math.abs(value)
  do {
    digits.push(rest % 10)
    rest = Math.floor(rest / 10)
  } while (rest > 0)
  return digits
}

/** Joins digits (ones first) back into a number: [2, 7, 4] → 472. */
function fromDigits(digits: number[]): number {
  return digits.reduce((total, digit, place) => total + digit * 10 ** place, 0)
}

/** Applies `combine` to each column of digits, with no carrying or borrowing between columns. */
function columnByColumn(a: number, b: number, combine: (x: number, y: number) => number) {
  const aDigits = toDigits(a)
  const bDigits = toDigits(b)
  const columns = Math.max(aDigits.length, bDigits.length)
  return fromDigits(
    Array.from({ length: columns }, (_, i) => combine(aDigits[i] ?? 0, bDigits[i] ?? 0)),
  )
}

/** Adding without carrying, e.g. 27 + 15 → 32 instead of 42. */
export function addWithoutCarrying(a: number, b: number): number {
  return columnByColumn(a, b, (x, y) => (x + y) % 10)
}

/** Subtracting the smaller digit from the larger in each column instead of borrowing, e.g. 42 − 17 → 35 instead of 25. */
export function subtractWithoutBorrowing(a: number, b: number): number {
  return columnByColumn(a, b, (x, y) => Math.abs(x - y))
}

/** A random number close to the answer, e.g. off by 1, 2, 3, or 10. May be negative. */
export function nearbyNumber(answer: number, random: RandomSource = Math.random): number {
  return answer + pickRandom(answer >= 100 ? LARGE_OFFSETS : SMALL_OFFSETS, random)
}

/** Wrong answers that come from mistakes children commonly make with this operation. */
export function commonMistakes(question: Question): number[] {
  const { leftOperand: a, rightOperand: b } = question

  switch (question.operation) {
    case 'addition':
      return [addWithoutCarrying(a, b), Math.abs(a - b)]
    case 'subtraction':
      return [subtractWithoutBorrowing(a, b), a + b]
    case 'multiplication':
      // Neighbouring facts in the times table, plus adding instead of multiplying.
      return [(a - 1) * b, (a + 1) * b, a * (b - 1), a * (b + 1), a + b]
    case 'division':
      // From the fact family of a ÷ b = c: the divisor itself (the answer to a ÷ c),
      // and dividing by a neighbouring number. Uneven results are filtered out later.
      return [b, a / (b - 1), a / (b + 1)]
  }
}

/**
 * Returns three different wrong answers for a question. They are whole numbers, never equal
 * to the correct answer, and never negative unless allowed.
 *
 * Up to two come from common mistakes; the rest are random nearby numbers. Nearby picks can
 * be rejected (e.g. negative ones near zero), so they are retried at most
 * `MAX_NEARBY_ATTEMPTS` times. If that isn't enough, any unused mistakes are added, and
 * finally numbers counting up from the answer, which always succeeds.
 */
export function generateDistractors(
  question: Question,
  random: RandomSource = Math.random,
  { allowNegative = false }: DistractorOptions = {},
): number[] {
  const answer = question.correctAnswer
  const chosen: number[] = []

  function tryAdd(candidate: number, limit = DISTRACTOR_COUNT) {
    if (
      chosen.length < limit &&
      Number.isSafeInteger(candidate) &&
      candidate !== answer &&
      (allowNegative || candidate >= 0) &&
      !chosen.includes(candidate)
    ) {
      chosen.push(candidate)
    }
  }

  const mistakes = shuffle(commonMistakes(question), random)
  mistakes.forEach((candidate) => tryAdd(candidate, MAX_MISTAKE_DISTRACTORS))

  for (
    let attempt = 0;
    chosen.length < DISTRACTOR_COUNT && attempt < MAX_NEARBY_ATTEMPTS;
    attempt++
  ) {
    tryAdd(nearbyNumber(answer, random))
  }

  mistakes.forEach((candidate) => tryAdd(candidate))

  for (let candidate = answer + 1; chosen.length < DISTRACTOR_COUNT; candidate++) {
    tryAdd(candidate)
  }

  return chosen
}
