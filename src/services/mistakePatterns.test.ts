import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import { createMistakePattern } from '../utils/mistakePatterns'
import { loadMistakePatterns, MAX_STORED_PATTERNS, saveMistakePatterns } from './mistakePatterns'

const KEY = 'math-practice:mistake-patterns'

const pattern = (left: number, day = 1) =>
  createMistakePattern({
    question: makeQuestion(left, 'addition', 1000 - left),
    userAnswer: 999,
    isCorrect: false,
    timeTakenMs: 1000,
    answeredAt: new Date(Date.UTC(2026, 9, day, 0, 0, left % 60)).toISOString(),
  })

describe('mistake pattern storage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('saves and loads patterns', () => {
    saveMistakePatterns([pattern(7)])

    expect(loadMistakePatterns()).toEqual([pattern(7)])
  })

  it('starts empty when nothing is saved or the data is broken', () => {
    expect(loadMistakePatterns()).toEqual([])
    localStorage.setItem(KEY, '{not json')
    expect(loadMistakePatterns()).toEqual([])
  })

  it('skips invalid records but keeps valid ones', () => {
    localStorage.setItem(KEY, JSON.stringify([{ key: 'nonsense' }, pattern(7), 42]))

    expect(loadMistakePatterns()).toEqual([pattern(7)])
  })

  it('keeps the most recently missed patterns when there are too many', () => {
    const many = Array.from({ length: MAX_STORED_PATTERNS }, (_, i) => pattern(i + 1, 1))
    const newest = createMistakePattern({
      question: makeQuestion(7, 'multiplication', 8),
      userAnswer: 54,
      isCorrect: false,
      timeTakenMs: 1000,
      answeredAt: '2026-10-05T00:00:00.000Z',
    })
    saveMistakePatterns([...many, newest])

    const saved = loadMistakePatterns()
    expect(saved).toHaveLength(MAX_STORED_PATTERNS)
    expect(saved[0]).toEqual(newest)
    // The one dropped was among the oldest.
    expect(saved.filter((p) => p.operation === 'addition')).toHaveLength(MAX_STORED_PATTERNS - 1)
  })

  it('keeps working when storage is unavailable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(saveMistakePatterns([pattern(7)])).toEqual({ ok: false, reason: 'unavailable' })
    expect(loadMistakePatterns()).toEqual([])
  })
})
