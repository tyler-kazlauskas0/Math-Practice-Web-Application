import type { DifficultyLevel, MathOperation, Question } from '../../types/question'
import { pickRandom, type RandomSource } from '../random'
import { generateAdditionQuestion } from './addition'
import { generateDivisionQuestion } from './division'
import { generateMultiplicationQuestion } from './multiplication'
import { generateSubtractionQuestion } from './subtraction'
import { isValidQuestion } from './validateQuestion'

const GENERATORS: Record<
  MathOperation,
  (difficulty: DifficultyLevel, random: RandomSource) => Question
> = {
  addition: generateAdditionQuestion,
  subtraction: generateSubtractionQuestion,
  multiplication: generateMultiplicationQuestion,
  division: generateDivisionQuestion,
}

/** How many times to try before giving up on a question. */
const MAX_ATTEMPTS = 5

/** Thrown when no valid question could be generated. */
export class QuestionGenerationError extends Error {
  name = 'QuestionGenerationError'
}

/**
 * Calls `generate` until it returns a valid question. A generator that throws or returns
 * an invalid question is retried; after `maxAttempts` failures this throws a
 * `QuestionGenerationError` whose `cause` is the last problem seen.
 */
export function generateValidQuestion(
  generate: () => Question,
  maxAttempts = MAX_ATTEMPTS,
): Question {
  let lastProblem: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const question = generate()
      if (isValidQuestion(question)) return question
      lastProblem = new Error(`Generated an invalid question: ${JSON.stringify(question)}`)
    } catch (error) {
      lastProblem = error
    }
  }

  throw new QuestionGenerationError(
    `Could not generate a valid question after ${maxAttempts} attempts`,
    { cause: lastProblem },
  )
}

/** Creates a question for one operation and difficulty level. */
export function generateQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const generator = GENERATORS[operation]
  if (!generator) {
    throw new QuestionGenerationError(`Unknown operation: ${operation}`)
  }
  return generateValidQuestion(() => generator(difficulty, random))
}

/** Creates a question for a practice session, picking one of the enabled operations at random. */
export function generatePracticeQuestion(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  if (operations.length === 0) {
    throw new QuestionGenerationError('At least one operation must be enabled')
  }
  return generateQuestion(pickRandom(operations, random), difficulty, random)
}
