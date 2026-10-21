import { describe, expect, it, vi } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import { repeat } from '../../test/randomSequence'
import type { DifficultyLevel, MathOperation, Question } from '../../types/question'
import {
  generatePracticeQuestion,
  generateQuestion,
  generateValidQuestion,
  QuestionGenerationError,
} from './generateQuestion'
import { isValidQuestion } from './validateQuestion'

const OPERATIONS = OPERATION_OPTIONS.map((option) => option.value)
const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]
const COMBINATIONS = OPERATIONS.flatMap((operation) =>
  LEVELS.map((difficulty) => [operation, difficulty] as const),
)

const goodQuestion: Question = {
  id: 'q1',
  operation: 'addition',
  difficulty: 'easy',
  leftOperand: 2,
  rightOperand: 3,
  correctAnswer: 5,
  displayText: '2 + 3',
}

describe('generateQuestion', () => {
  it.each(COMBINATIONS)('creates valid %s questions at %s', (operation, difficulty) => {
    repeat(200, () => {
      const question = generateQuestion(operation, difficulty)

      expect(question.operation).toBe(operation)
      expect(question.difficulty).toBe(difficulty)
      expect(isValidQuestion(question)).toBe(true)
    })
  })

  it('gives every question a unique id', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateQuestion('addition', 'easy').id))
    expect(ids.size).toBe(500)
  })

  it('rejects an unknown operation', () => {
    expect(() => generateQuestion('modulo' as MathOperation, 'easy')).toThrow(
      QuestionGenerationError,
    )
  })

  it('fails clearly for an unknown difficulty', () => {
    expect(() => generateQuestion('addition', 'hard' as DifficultyLevel)).toThrow(
      QuestionGenerationError,
    )
  })
})

describe('generatePracticeQuestion', () => {
  it('only uses the enabled operations', () => {
    repeat(500, () => {
      const question = generatePracticeQuestion(['subtraction', 'division'], 'intermediate')
      expect(['subtraction', 'division']).toContain(question.operation)
    })
  })

  it('picks every enabled operation over many questions', () => {
    const seen = new Set<MathOperation>()
    repeat(500, () => seen.add(generatePracticeQuestion(OPERATIONS, 'beginner').operation))

    expect([...seen].sort()).toEqual([...OPERATIONS].sort())
  })

  it('picks the operation using the random source', () => {
    expect(generatePracticeQuestion(OPERATIONS, 'easy', () => 0).operation).toBe('addition')
    expect(generatePracticeQuestion(OPERATIONS, 'easy', () => 0.9999999).operation).toBe('division')
  })

  it('rejects an empty list of operations', () => {
    expect(() => generatePracticeQuestion([], 'easy')).toThrow(QuestionGenerationError)
  })
})

describe('generateValidQuestion', () => {
  it('returns the first valid question', () => {
    const generate = vi.fn(() => goodQuestion)

    expect(generateValidQuestion(generate)).toBe(goodQuestion)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('retries after an invalid question or an error', () => {
    const generate = vi
      .fn<() => Question>()
      .mockReturnValueOnce({ ...goodQuestion, correctAnswer: 6 })
      .mockImplementationOnce(() => {
        throw new Error('boom')
      })
      .mockReturnValue(goodQuestion)

    expect(generateValidQuestion(generate)).toBe(goodQuestion)
    expect(generate).toHaveBeenCalledTimes(3)
  })

  it('gives up after the maximum attempts with the last problem as the cause', () => {
    const problem = new Error('always broken')
    const generate = vi.fn<() => Question>(() => {
      throw problem
    })

    let thrown: unknown
    try {
      generateValidQuestion(generate, 3)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(QuestionGenerationError)
    expect((thrown as Error).cause).toBe(problem)
    expect(generate).toHaveBeenCalledTimes(3)
  })
})
