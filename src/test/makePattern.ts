import type { MistakePattern } from '../types/mistake'
import type { DifficultyLevel, MathOperation } from '../types/question'
import { createMistakePattern } from '../utils/mistakePatterns'
import { makeQuestion } from './makeQuestion'

/** Builds a mistake pattern for tests, e.g. `makePattern(7, 'multiplication', 8)`. */
export function makePattern(
  left: number,
  operation: MathOperation,
  right: number,
  overrides: Partial<MistakePattern> = {},
  difficulty: DifficultyLevel = 'easy',
): MistakePattern {
  return {
    ...createMistakePattern({
      question: { ...makeQuestion(left, operation, right), difficulty },
      userAnswer: 0,
      isCorrect: false,
      timeTakenMs: 1000,
      answeredAt: '2026-10-21T10:00:00.000Z',
    }),
    ...overrides,
  }
}
