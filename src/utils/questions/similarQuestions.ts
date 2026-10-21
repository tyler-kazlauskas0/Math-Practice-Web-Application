import type { MistakePattern } from '../../types/mistake'
import type { DifficultyLevel, MathOperation, Question } from '../../types/question'
import { createId } from '../id'
import { pickRandom, shuffle, type RandomSource } from '../random'
import { fitsDifficulty } from './difficultyCheck'
import { formatQuestion } from './formatQuestion'
import { isValidQuestion } from './validateQuestion'

/** The ways a question can be related to a mistake. */
export type SimilarityStrategy = 'nearby-numbers' | 'reversed-operands' | 'fact-family'

/** The operand pairs a strategy suggests, before checking. */
type Fact = { operation: MathOperation; left: number; right: number }

/** How far "nearby" numbers can be from the original. */
const NEARBY_STEPS = [-2, -1, 1, 2]

const answerOf = ({ operation, left, right }: Fact) =>
  ({
    addition: left + right,
    subtraction: left - right,
    multiplication: left * right,
    division: left / right,
  })[operation]

/**
 * The same kind of question with one number changed a little, e.g. 7 × 8 → 7 × 9 or 6 × 8.
 * Division changes the divisor or the answer and rebuilds the number being divided, so it
 * always divides evenly.
 */
export function nearbyNumberFacts(pattern: MistakePattern): Fact[] {
  const { operation, leftOperand: a, rightOperand: b, correctAnswer } = pattern
  if (operation === 'division') {
    return NEARBY_STEPS.flatMap((step) => [
      { operation, left: (b + step) * correctAnswer, right: b + step },
      { operation, left: b * (correctAnswer + step), right: b },
    ])
  }
  return NEARBY_STEPS.flatMap((step) => [
    { operation, left: a + step, right: b },
    { operation, left: a, right: b + step },
  ])
}

/**
 * The same fact with the numbers swapped, e.g. 7 × 8 → 8 × 7. Only for addition and
 * multiplication: swapping subtraction or division gives a different question.
 */
export function reversedOperandFacts(pattern: MistakePattern): Fact[] {
  const { operation, leftOperand: a, rightOperand: b } = pattern
  if (operation !== 'addition' && operation !== 'multiplication') return []
  return [{ operation, left: b, right: a }]
}

/**
 * Related facts from the same fact family, e.g. 7 × 8 = 56 gives 56 ÷ 7 and 56 ÷ 8;
 * 9 − 4 = 5 gives 5 + 4 and 4 + 5.
 */
export function factFamilyFacts(pattern: MistakePattern): Fact[] {
  const { operation, leftOperand: a, rightOperand: b, correctAnswer: c } = pattern
  switch (operation) {
    case 'multiplication':
      return [
        { operation: 'division', left: c, right: a },
        { operation: 'division', left: c, right: b },
      ]
    case 'division':
      return [
        { operation: 'multiplication', left: b, right: c },
        { operation: 'multiplication', left: c, right: b },
      ]
    case 'addition':
      return [
        { operation: 'subtraction', left: c, right: a },
        { operation: 'subtraction', left: c, right: b },
      ]
    case 'subtraction':
      return [
        { operation: 'addition', left: c, right: b },
        { operation: 'addition', left: b, right: c },
      ]
  }
}

const STRATEGIES: Record<SimilarityStrategy, (pattern: MistakePattern) => Fact[]> = {
  'nearby-numbers': nearbyNumberFacts,
  'reversed-operands': reversedOperandFacts,
  'fact-family': factFamilyFacts,
}

/** The strategies that make sense for an operation. */
export function strategiesFor(operation: MathOperation): SimilarityStrategy[] {
  return operation === 'addition' || operation === 'multiplication'
    ? ['nearby-numbers', 'reversed-operands', 'fact-family']
    : ['nearby-numbers', 'fact-family']
}

function toQuestion(fact: Fact, difficulty: DifficultyLevel, pattern: MistakePattern): Question {
  return {
    id: createId(),
    operation: fact.operation,
    difficulty,
    leftOperand: fact.left,
    rightOperand: fact.right,
    correctAnswer: answerOf(fact),
    displayText: formatQuestion(fact.left, fact.operation, fact.right),
    source: 'mistake-review',
    mistakePatternId: pattern.key,
  }
}

export interface SimilarQuestionOptions {
  /** The level the question must fit. Defaults to the level the mistake was made at. */
  difficulty?: DifficultyLevel
  /** Display texts of recently asked questions, e.g. `7 × 9`, to avoid repeating. */
  recentQuestions?: readonly string[]
  random?: RandomSource
}

export interface SimilarQuestion {
  question: Question
  strategy: SimilarityStrategy
}

/**
 * Makes a new question related to a mistake: nearby numbers, the operands reversed, or a
 * fact from the same family. Strategies are tried in random order so practice stays varied.
 *
 * The question is always valid (whole numbers, no division by zero, no negative answers),
 * fits the difficulty level, and differs from the original. Recently asked questions are
 * avoided when possible. Returns `null` if no related question fits the difficulty, e.g. a
 * mistake from Advanced when practicing at Beginner.
 */
export function generateSimilarQuestion(
  pattern: MistakePattern,
  {
    difficulty = pattern.difficulty,
    recentQuestions = [],
    random = Math.random,
  }: SimilarQuestionOptions = {},
): SimilarQuestion | null {
  const original = formatQuestion(pattern.leftOperand, pattern.operation, pattern.rightOperand)
  const recent = new Set(recentQuestions)

  const options = shuffle(strategiesFor(pattern.operation), random).flatMap((strategy) => {
    const questions = STRATEGIES[strategy](pattern)
      .map((fact) => toQuestion(fact, difficulty, pattern))
      .filter(
        (question) =>
          isValidQuestion(question) &&
          fitsDifficulty(question, difficulty) &&
          question.displayText !== original,
      )
    return questions.map((question) => ({ question, strategy }))
  })
  if (options.length === 0) return null

  // Prefer the first strategy (in the shuffled order) that has something not asked recently.
  const fresh = options.filter(({ question }) => !recent.has(question.displayText))
  const pool = fresh.length > 0 ? fresh : options
  const strategy = pool[0].strategy
  return pickRandom(
    pool.filter((option) => option.strategy === strategy),
    random,
  )
}
