import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import { makeQuestion } from '../../test/makeQuestion'
import { repeat } from '../../test/randomSequence'
import type { MistakePattern } from '../../types/mistake'
import type { DifficultyLevel, MathOperation } from '../../types/question'
import { createMistakePattern } from '../mistakePatterns'
import { fitsDifficulty } from './difficultyCheck'
import { formatQuestion } from './formatQuestion'
import { generateQuestion } from './generateQuestion'
import {
  factFamilyFacts,
  generateSimilarQuestion,
  nearbyNumberFacts,
  reversedOperandFacts,
  strategiesFor,
} from './similarQuestions'
import { isValidQuestion } from './validateQuestion'

const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]
const OPERATIONS = OPERATION_OPTIONS.map((option) => option.value)

function patternFor(
  left: number,
  operation: MathOperation,
  right: number,
  difficulty: DifficultyLevel = 'easy',
): MistakePattern {
  return createMistakePattern({
    question: { ...makeQuestion(left, operation, right), difficulty },
    userAnswer: 0,
    isCorrect: false,
    timeTakenMs: 1000,
    answeredAt: '2026-10-21T10:00:00.000Z',
  })
}

const texts = (facts: { operation: MathOperation; left: number; right: number }[]) =>
  facts.map(({ left, operation, right }) => `${left} ${operation} ${right}`)

describe('nearby-number questions', () => {
  it('changes one number a little', () => {
    expect(texts(nearbyNumberFacts(patternFor(7, 'multiplication', 8)))).toEqual(
      expect.arrayContaining([
        '6 multiplication 8',
        '7 multiplication 9',
        '9 multiplication 8',
        '7 multiplication 6',
      ]),
    )
  })

  it('keeps division even by rebuilding the number being divided', () => {
    // 56 ÷ 7 = 8: nearby divisors 6 → 48 ÷ 6, and nearby answers 9 → 63 ÷ 7.
    expect(texts(nearbyNumberFacts(patternFor(56, 'division', 7)))).toEqual(
      expect.arrayContaining(['48 division 6', '63 division 7']),
    )
    nearbyNumberFacts(patternFor(56, 'division', 7)).forEach((fact) => {
      if (fact.right !== 0) expect(fact.left % fact.right).toBe(0)
    })
  })
})

describe('reversed-operand questions', () => {
  it('swaps the numbers for addition and multiplication', () => {
    expect(texts(reversedOperandFacts(patternFor(3, 'addition', 5)))).toEqual(['5 addition 3'])
    expect(texts(reversedOperandFacts(patternFor(7, 'multiplication', 8)))).toEqual([
      '8 multiplication 7',
    ])
  })

  it('never swaps subtraction or division, which would change the answer', () => {
    expect(reversedOperandFacts(patternFor(9, 'subtraction', 4))).toEqual([])
    expect(reversedOperandFacts(patternFor(56, 'division', 7))).toEqual([])
    expect(strategiesFor('subtraction')).not.toContain('reversed-operands')
    expect(strategiesFor('division')).not.toContain('reversed-operands')
  })
})

describe('fact-family questions', () => {
  it.each([
    [
      'division from multiplication',
      patternFor(7, 'multiplication', 8),
      ['56 division 7', '56 division 8'],
    ],
    [
      'multiplication from division',
      patternFor(56, 'division', 7),
      ['7 multiplication 8', '8 multiplication 7'],
    ],
    [
      'subtraction from addition',
      patternFor(4, 'addition', 5),
      ['9 subtraction 4', '9 subtraction 5'],
    ],
    [
      'addition from subtraction',
      patternFor(9, 'subtraction', 4),
      ['5 addition 4', '4 addition 5'],
    ],
  ])('makes %s', (_, pattern, expected) => {
    expect(texts(factFamilyFacts(pattern))).toEqual(expected)
  })
})

describe('generateSimilarQuestion', () => {
  it.each(OPERATIONS.flatMap((operation) => LEVELS.map((level) => [operation, level] as const)))(
    'makes valid, related %s questions that fit %s',
    (operation, difficulty) => {
      repeat(100, () => {
        const pattern = createMistakePattern({
          question: generateQuestion(operation, difficulty),
          userAnswer: 0,
          isCorrect: false,
          timeTakenMs: 1000,
          answeredAt: '2026-10-21T10:00:00.000Z',
        })
        const result = generateSimilarQuestion(pattern)
        if (result === null) return // e.g. 1 × 1 has no different related fact in range

        const { question } = result
        expect(isValidQuestion(question), question.displayText).toBe(true)
        expect(fitsDifficulty(question, difficulty), question.displayText).toBe(true)
        const original = formatQuestion(
          pattern.leftOperand,
          pattern.operation,
          pattern.rightOperand,
        )
        expect(question.displayText).not.toBe(original)
        expect(question.difficulty).toBe(difficulty)
      })
    },
  )

  it('labels the question as mistake review and links the pattern', () => {
    const pattern = patternFor(7, 'multiplication', 8)
    const result = generateSimilarQuestion(pattern)!

    expect(result.question.source).toBe('mistake-review')
    expect(result.question.mistakePatternId).toBe('multiplication:7:8')
    expect(result.question.id).toEqual(expect.any(String))
  })

  it('never asks the exact original question', () => {
    const pattern = patternFor(7, 'multiplication', 8)
    repeat(200, () => {
      expect(generateSimilarQuestion(pattern)!.question.displayText).not.toBe('7 × 8')
    })
  })

  it('uses every strategy that applies to the operation', () => {
    for (const operation of OPERATIONS) {
      const pattern = {
        addition: patternFor(6, 'addition', 7),
        subtraction: patternFor(15, 'subtraction', 6),
        multiplication: patternFor(6, 'multiplication', 7),
        division: patternFor(42, 'division', 6),
      }[operation]
      const used = new Set<string>()
      repeat(300, () => used.add(generateSimilarQuestion(pattern)!.strategy))

      expect([...used].sort()).toEqual([...strategiesFor(operation)].sort())
    }
  })

  it('matches the chosen difficulty, not just the one the mistake was made at', () => {
    // 7 × 8 was missed at Easy; at Beginner (times tables 1–5) related facts must stay small.
    const pattern = patternFor(7, 'multiplication', 8)
    repeat(200, () => {
      const result = generateSimilarQuestion(pattern, { difficulty: 'beginner' })
      if (result) expect(fitsDifficulty(result.question, 'beginner')).toBe(true)
    })
  })

  it('returns null when nothing related fits the difficulty', () => {
    // 300 + 400 at Beginner (numbers up to 10): no related question can fit.
    expect(
      generateSimilarQuestion(patternFor(300, 'addition', 400, 'advanced'), {
        difficulty: 'beginner',
      }),
    ).toBeNull()
  })

  it('never makes invalid subtraction or division questions', () => {
    const subtraction = patternFor(5, 'subtraction', 5)
    const division = patternFor(2, 'division', 1)
    repeat(300, () => {
      for (const pattern of [subtraction, division]) {
        const result = generateSimilarQuestion(pattern)
        if (result === null) continue
        expect(isValidQuestion(result.question), result.question.displayText).toBe(true)
        expect(result.question.correctAnswer).toBeGreaterThanOrEqual(0)
        if (result.question.operation === 'division') {
          expect(result.question.rightOperand).not.toBe(0)
        }
      }
    })
  })

  it('avoids recently asked questions when it can', () => {
    const pattern = patternFor(7, 'multiplication', 8)
    const recent = ['8 × 7', '56 ÷ 7', '56 ÷ 8', '6 × 8', '7 × 9']

    repeat(200, () => {
      const { question } = generateSimilarQuestion(pattern, { recentQuestions: recent })!
      expect(recent).not.toContain(question.displayText)
    })
  })

  it('still asks something when every option was recent', () => {
    const pattern = patternFor(1, 'multiplication', 2, 'beginner')
    const everything = new Set<string>()
    repeat(300, () => everything.add(generateSimilarQuestion(pattern)!.question.displayText))

    expect(generateSimilarQuestion(pattern, { recentQuestions: [...everything] })).not.toBeNull()
  })

  it('is varied rather than repeating the same question', () => {
    const pattern = patternFor(7, 'multiplication', 8)
    const seen = new Set<string>()
    repeat(100, () => seen.add(generateSimilarQuestion(pattern)!.question.displayText))

    expect(seen.size).toBeGreaterThanOrEqual(6)
  })
})
