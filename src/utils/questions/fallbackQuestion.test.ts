import { afterEach, describe, expect, it, vi } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import type { DifficultyLevel, MathOperation, Question } from '../../types/question'
import * as generate from './generateQuestion'
import * as answerChoices from './answerChoices'
import { createRound, choicesFor } from '../practiceSession'
import { fitsDifficulty } from './difficultyCheck'
import { createFallbackQuestion } from './fallbackQuestion'
import { isValidQuestion } from './validateQuestion'

vi.mock('./generateQuestion', { spy: true })
vi.mock('./answerChoices', { spy: true })

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]
const OPERATIONS = OPERATION_OPTIONS.map((option) => option.value)

describe('createFallbackQuestion', () => {
  it.each(OPERATIONS.flatMap((op) => LEVELS.map((level) => [op, level] as const)))(
    'is always valid and fits the level for %s at %s',
    (operation, difficulty) => {
      const question = createFallbackQuestion(operation, difficulty)

      expect(isValidQuestion(question)).toBe(true)
      expect(fitsDifficulty(question, difficulty)).toBe(true)
      expect(question).toMatchObject({ operation, difficulty })
    },
  )

  it('still makes a valid question from unknown input', () => {
    const question = createFallbackQuestion(
      'modulo' as MathOperation,
      'impossible' as DifficultyLevel,
    )

    expect(isValidQuestion(question)).toBe(true)
    expect(question.displayText).toBe('1 + 1')
  })
})

describe('when generation fails', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses a fallback question so practice can continue, and logs it for developers', () => {
    vi.mocked(generate.generatePracticeQuestion).mockImplementation(() => {
      throw new generate.QuestionGenerationError('broken generator')
    })
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const round = createRound({ operations: ['division'], difficulty: 'easy', sessionLength: 5 })

    expect(isValidQuestion(round.question)).toBe(true)
    expect(round.question.operation).toBe('division')
    expect(round.choices).toContain(round.question.correctAnswer)
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Question generation failed'),
      expect.any(generate.QuestionGenerationError),
    )
  })

  it('uses simple answer choices if making distractors fails', () => {
    vi.mocked(answerChoices.createAnswerChoices).mockImplementation(() => {
      throw new Error('broken distractors')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const question = { ...createFallbackQuestion('addition', 'easy') } as Question

    const choices = choicesFor(question)

    expect([...choices].sort((a, b) => a - b)).toEqual([2, 3, 4, 5])
  })
})
