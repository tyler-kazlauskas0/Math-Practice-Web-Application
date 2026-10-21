import type { Question } from '../../types/question'
import { shuffle, type RandomSource } from '../random'
import { DISTRACTOR_COUNT, generateDistractors, type DistractorOptions } from './distractors'

/** How many choices each multiple-choice question shows. */
export const ANSWER_CHOICE_COUNT = DISTRACTOR_COUNT + 1

/**
 * Returns the four multiple-choice answers for a question: the correct answer and three
 * distractors, shuffled so the correct answer can be in any position.
 */
export function createAnswerChoices(
  question: Question,
  random: RandomSource = Math.random,
  options?: DistractorOptions,
): number[] {
  const choices = shuffle(
    [question.correctAnswer, ...generateDistractors(question, random, options)],
    random,
  )

  const correctCount = choices.filter((choice) => choice === question.correctAnswer).length
  if (
    choices.length !== ANSWER_CHOICE_COUNT ||
    new Set(choices).size !== ANSWER_CHOICE_COUNT ||
    correctCount !== 1
  ) {
    throw new Error(`Invalid answer choices for ${question.displayText}: ${choices.join(', ')}`)
  }
  return choices
}
