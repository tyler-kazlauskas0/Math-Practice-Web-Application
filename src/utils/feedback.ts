import { pickRandom, type RandomSource } from './random'

/** Said after an answer the player marked right. */
export const POSITIVE_FEEDBACK = [
  'Great job!',
  'You got it!',
  'Awesome work!',
  'Nice thinking!',
  'Way to go!',
  'Super math skills!',
  'Excellent!',
  'Keep it up!',
]

/**
 * Said after an answer the player marked wrong. Kind and encouraging: about effort and
 * learning, never about being wrong or bad at math.
 */
export const SUPPORTIVE_FEEDBACK = [
  'Good try! Practice helps you learn.',
  'Mistakes help your brain grow.',
  'Nice effort. You’ll get it next time!',
  'That’s okay! Every try makes you stronger.',
  'Thanks for being honest. Let’s keep going!',
  'Keep trying. You’re learning!',
]

/**
 * A random message for a right or wrong answer, never the same as `previous`, so feedback
 * varies without repeating back-to-back.
 */
export function pickFeedback(
  markedCorrect: boolean,
  previous: string | null = null,
  random: RandomSource = Math.random,
): string {
  const messages = markedCorrect ? POSITIVE_FEEDBACK : SUPPORTIVE_FEEDBACK
  return pickRandom(
    messages.filter((message) => message !== previous),
    random,
  )
}

/** A friendly closing line for the summary page, based on accuracy (0–1). Never discouraging. */
export function summaryFeedback(accuracy: number): string {
  if (accuracy >= 0.9) return 'Amazing work! You really know your stuff.'
  if (accuracy >= 0.7) return 'Great job! You’re getting really good at this.'
  if (accuracy >= 0.5) return 'Nice effort! Every practice makes you stronger.'
  return 'Thanks for practicing! Tricky questions are how we learn. Keep going!'
}
