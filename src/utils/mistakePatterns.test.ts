import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import type { MistakePattern } from '../types/mistake'
import type { MathOperation } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import { makePattern } from '../test/makePattern'
import {
  activePatterns,
  applyAttempt,
  createMistakePattern,
  isMastered,
  isMistakePattern,
  MAX_SAVED_WRONG_ANSWERS,
  parseMistakePatterns,
  patternKey,
  recordMistake,
  recordReviewMiss,
  recordReviewSuccess,
  updateMistakePattern,
} from './mistakePatterns'

function wrong(
  left: number,
  operation: MathOperation,
  right: number,
  userAnswer: number,
  answeredAt = '2026-10-21T10:00:00.000Z',
): PracticeAttempt {
  return {
    question: { ...makeQuestion(left, operation, right), difficulty: 'intermediate' },
    userAnswer,
    isCorrect: false,
    timeTakenMs: 3000,
    answeredAt,
  }
}

describe('createMistakePattern', () => {
  it('stores the fact, difficulty, date, and starting counts', () => {
    expect(createMistakePattern(wrong(7, 'multiplication', 8, 54))).toEqual({
      key: 'multiplication:7:8',
      operation: 'multiplication',
      leftOperand: 7,
      rightOperand: 8,
      correctAnswer: 56,
      difficulty: 'intermediate',
      incorrectCount: 1,
      similarCorrectCount: 0,
      incorrectAnswers: [54],
      firstIncorrectAt: '2026-10-21T10:00:00.000Z',
      lastIncorrectAt: '2026-10-21T10:00:00.000Z',
      masteredAt: null,
    })
  })
})

describe('patternKey', () => {
  it('treats 7 × 8 and 8 × 7 (and 3 + 5 and 5 + 3) as the same fact', () => {
    expect(patternKey(makeQuestion(8, 'multiplication', 7))).toBe('multiplication:7:8')
    expect(patternKey(makeQuestion(5, 'addition', 3))).toBe(
      patternKey(makeQuestion(3, 'addition', 5)),
    )
  })

  it('keeps the order for subtraction and division', () => {
    expect(patternKey(makeQuestion(9, 'subtraction', 4))).toBe('subtraction:9:4')
    expect(patternKey(makeQuestion(56, 'division', 7))).not.toBe(
      patternKey(makeQuestion(56, 'division', 8)),
    )
  })
})

describe('updateMistakePattern', () => {
  it('counts the mistake, updates the time, and resets mastery progress', () => {
    const pattern: MistakePattern = {
      ...createMistakePattern(wrong(7, 'multiplication', 8, 54)),
      similarCorrectCount: 3,
    }

    const updated = updateMistakePattern(
      pattern,
      wrong(7, 'multiplication', 8, 63, '2026-10-22T09:00:00.000Z'),
    )

    expect(updated).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      incorrectAnswers: [54, 63],
      firstIncorrectAt: '2026-10-21T10:00:00.000Z',
      lastIncorrectAt: '2026-10-22T09:00:00.000Z',
    })
  })

  it('keeps only the most recent wrong answers', () => {
    let pattern = createMistakePattern(wrong(7, 'multiplication', 8, 1))
    for (let answer = 2; answer <= 8; answer++) {
      pattern = updateMistakePattern(pattern, wrong(7, 'multiplication', 8, answer))
    }

    expect(pattern.incorrectAnswers).toHaveLength(MAX_SAVED_WRONG_ANSWERS)
    expect(pattern.incorrectAnswers.at(-1)).toBe(8)
    expect(pattern.incorrectCount).toBe(8)
  })
})

describe('recordMistake', () => {
  it('adds a pattern for a new mistake', () => {
    expect(recordMistake([], wrong(9, 'subtraction', 4, 4))).toHaveLength(1)
  })

  it('updates the existing pattern instead of adding a duplicate', () => {
    let patterns = recordMistake([], wrong(7, 'multiplication', 8, 54))
    patterns = recordMistake(patterns, wrong(8, 'multiplication', 7, 48))
    patterns = recordMistake(patterns, wrong(7, 'multiplication', 8, 57))

    expect(patterns).toHaveLength(1)
    expect(patterns[0]).toMatchObject({ leftOperand: 7, rightOperand: 8, incorrectCount: 3 })
  })

  it('keeps different facts separate', () => {
    let patterns = recordMistake([], wrong(7, 'multiplication', 8, 54))
    patterns = recordMistake(patterns, wrong(7, 'addition', 8, 14))

    expect(patterns.map((pattern) => pattern.key)).toEqual(['multiplication:7:8', 'addition:7:8'])
  })

  it('ignores right answers', () => {
    const patterns = recordMistake([], wrong(7, 'multiplication', 8, 54))

    expect(recordMistake(patterns, { ...wrong(7, 'multiplication', 8, 56), isCorrect: true })).toBe(
      patterns,
    )
  })
})

describe('parseMistakePatterns', () => {
  const valid = createMistakePattern(wrong(7, 'multiplication', 8, 54))

  it('keeps valid patterns', () => {
    expect(parseMistakePatterns([valid])).toEqual([valid])
    expect(isMistakePattern(valid)).toBe(true)
  })

  it.each<[string, unknown]>([
    ['a wrong correct answer', { ...valid, correctAnswer: 55 }],
    ['an unknown operation', { ...valid, operation: 'modulo' }],
    ['an unknown difficulty', { ...valid, difficulty: 'hard' }],
    ['a key that does not match the fact', { ...valid, key: 'multiplication:6:8' }],
    ['a zero incorrect count', { ...valid, incorrectCount: 0 }],
    ['a negative mastery count', { ...valid, similarCorrectCount: -1 }],
    ['a bad date', { ...valid, lastIncorrectAt: 'yesterday' }],
    ['division by zero', { ...valid, operation: 'division', key: 'division:7:0', rightOperand: 0 }],
    ['not an object', 'junk'],
  ])('skips a record with %s, keeping the rest', (_, bad) => {
    expect(parseMistakePatterns([bad, valid])).toEqual([valid])
  })

  it('returns an empty list for data that is not a list', () => {
    expect(parseMistakePatterns({ patterns: [valid] })).toEqual([])
    expect(parseMistakePatterns(null)).toEqual([])
  })

  it('merges duplicate records of the same fact', () => {
    const later = {
      ...valid,
      incorrectCount: 2,
      incorrectAnswers: [63, 48],
      firstIncorrectAt: '2026-10-22T09:00:00.000Z',
      lastIncorrectAt: '2026-10-23T09:00:00.000Z',
    }

    expect(parseMistakePatterns([valid, later])).toEqual([
      {
        ...later,
        incorrectCount: 3,
        incorrectAnswers: [54, 63, 48],
        firstIncorrectAt: '2026-10-21T10:00:00.000Z',
      },
    ])
  })
})

describe('mastery', () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 9, 22, 10, minute)).toISOString()

  it('counts correct related answers and masters the pattern at the threshold', () => {
    let pattern = makePattern(7, 'multiplication', 8)

    pattern = recordReviewSuccess(pattern, at(1), 3)
    pattern = recordReviewSuccess(pattern, at(2), 3)
    expect(pattern.similarCorrectCount).toBe(2)
    expect(isMastered(pattern)).toBe(false)

    pattern = recordReviewSuccess(pattern, at(3), 3)
    expect(pattern.similarCorrectCount).toBe(3)
    expect(pattern.masteredAt).toBe(at(3))
  })

  it('uses whatever threshold is configured', () => {
    const once = recordReviewSuccess(makePattern(7, 'multiplication', 8), at(1), 2)
    expect(isMastered(once)).toBe(false)
    expect(isMastered(recordReviewSuccess(once, at(2), 2))).toBe(true)

    let five = makePattern(7, 'multiplication', 8)
    for (let i = 1; i <= 4; i++) five = recordReviewSuccess(five, at(i), 5)
    expect(isMastered(five)).toBe(false)
    expect(isMastered(recordReviewSuccess(five, at(5), 5))).toBe(true)
  })

  it('keeps the first mastery time if more correct answers come in', () => {
    let pattern = makePattern(7, 'multiplication', 8, { similarCorrectCount: 2 })
    pattern = recordReviewSuccess(pattern, at(1), 3)
    pattern = recordReviewSuccess(pattern, at(2), 3)

    expect(pattern.masteredAt).toBe(at(1))
  })

  it('resets progress after a wrong related answer, counting it against the original', () => {
    const pattern = makePattern(7, 'multiplication', 8, { similarCorrectCount: 2 })

    const missed = recordReviewMiss(pattern, at(5))

    expect(missed).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      lastIncorrectAt: at(5),
      masteredAt: null,
      incorrectAnswers: pattern.incorrectAnswers,
    })
  })

  it('brings a mastered pattern back after a future mistake', () => {
    const mastered = makePattern(7, 'multiplication', 8, {
      similarCorrectCount: 3,
      masteredAt: at(1),
    })
    expect(activePatterns([mastered])).toEqual([])

    const missedInPractice = updateMistakePattern(mastered, {
      question: { ...makeQuestion(8, 'multiplication', 7), difficulty: 'easy' },
      userAnswer: 54,
      isCorrect: false,
      timeTakenMs: 1000,
      answeredAt: at(9),
    })
    expect(missedInPractice).toMatchObject({ masteredAt: null, similarCorrectCount: 0 })
    expect(activePatterns([missedInPractice])).toHaveLength(1)

    expect(recordReviewMiss(mastered, at(9)).masteredAt).toBeNull()
  })
})

describe('applyAttempt', () => {
  const reviewAnswer = (isCorrect: boolean, patternId = 'multiplication:7:8'): PracticeAttempt => ({
    question: {
      ...makeQuestion(56, 'division', 8),
      source: 'mistake-review',
      mistakePatternId: patternId,
    },
    userAnswer: isCorrect ? 7 : 6,
    isCorrect,
    timeTakenMs: 1000,
    answeredAt: '2026-10-22T10:00:00.000Z',
  })

  it('updates the original pattern for a correct review answer', () => {
    const patterns = [makePattern(7, 'multiplication', 8)]

    const [updated] = applyAttempt(patterns, reviewAnswer(true), 3)

    expect(updated.similarCorrectCount).toBe(1)
  })

  it('updates the original pattern, not a new one, for a wrong review answer', () => {
    const patterns = [makePattern(7, 'multiplication', 8, { similarCorrectCount: 2 })]

    const updated = applyAttempt(patterns, reviewAnswer(false), 3)

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      key: 'multiplication:7:8',
      incorrectCount: 2,
      similarCorrectCount: 0,
    })
  })

  it('records a wrong review answer as a new mistake if the original pattern is gone', () => {
    const updated = applyAttempt([], reviewAnswer(false, 'multiplication:9:9'), 3)

    expect(updated.map((p) => p.key)).toEqual(['division:56:8'])
  })

  it('treats ordinary answers as before', () => {
    expect(applyAttempt([], wrong(7, 'multiplication', 8, 54), 3)).toHaveLength(1)
    const right = { ...wrong(7, 'multiplication', 8, 56), isCorrect: true }
    expect(applyAttempt([], right, 3)).toEqual([])
  })
})

describe('older saved patterns', () => {
  it('are loaded as still needing review', () => {
    const legacy: Partial<MistakePattern> = makePattern(7, 'multiplication', 8)
    delete legacy.masteredAt

    expect(parseMistakePatterns([legacy])).toEqual([{ ...legacy, masteredAt: null }])
  })
})
