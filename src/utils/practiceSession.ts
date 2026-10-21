import type { MistakePattern } from '../types/mistake'
import type { Question } from '../types/question'
import type {
  PracticeAttempt,
  PracticeConfig,
  PracticeRound,
  PracticeSessionState,
} from '../types/session'
import { createId } from './id'
import { createAnswerChoices } from './questions/answerChoices'
import { generatePracticeQuestion } from './questions/generateQuestion'
import { logDevError } from './devLog'
import { activePatterns } from './mistakePatterns'
import { shuffle, type RandomSource } from './random'
import { createFallbackQuestion } from './questions/fallbackQuestion'
import { generateSimilarQuestion } from './questions/similarQuestions'
import { isValidQuestion } from './questions/validateQuestion'

/** How many times to try for a question that differs from the previous one. */
const MAX_REPEAT_ATTEMPTS = 10

/** Answer choices for a question, or a simple safe set if making distractors fails. */
export function choicesFor(question: Question): number[] {
  try {
    return createAnswerChoices(question)
  } catch (error) {
    logDevError(
      `Couldn't make answer choices for ${question.displayText}; using simple ones`,
      error,
    )
    const answer = question.correctAnswer
    return shuffle([answer, answer + 1, answer + 2, answer + 3])
  }
}

/**
 * Creates a question and its answer choices. Generated questions are validated and retried
 * (see `generateValidQuestion`); if that still fails, a simple fallback question is used so
 * practice can continue.
 */
export function createRound(config: PracticeConfig): PracticeRound {
  let question: Question
  try {
    question = generatePracticeQuestion(config.operations, config.difficulty)
  } catch (error) {
    logDevError('Question generation failed; using a fallback question', error)
    question = createFallbackQuestion(config.operations[0] ?? 'addition', config.difficulty)
  }
  return { question, choices: choicesFor(question) }
}

/**
 * Creates the next round, avoiding the exact question just asked (e.g. `3 × 4` twice in a
 * row). Gives up after a few tries, since some settings have very few possible questions.
 */
export function createNextRound(
  config: PracticeConfig,
  previous: PracticeRound | null,
  makeRound: (config: PracticeConfig) => PracticeRound = createRound,
): PracticeRound {
  let round = makeRound(config)
  for (
    let attempt = 1;
    attempt < MAX_REPEAT_ATTEMPTS && round.question.displayText === previous?.question.displayText;
    attempt++
  ) {
    round = makeRound(config)
  }
  return round
}

/**
 * Asks a saved question again, with a new ID (so it gets a fresh card) and freshly
 * shuffled answer choices.
 */
export function createReviewRound(question: Question): PracticeRound {
  const reviewQuestion = { ...question, id: createId() }
  return { question: reviewQuestion, choices: choicesFor(reviewQuestion) }
}

/**
 * The next mistake-review question. Patterns take turns in `order` (so one session mixes
 * several mistakes), skipping any that have been mastered since the session started. Each
 * turn asks a question related to the pattern, avoiding `recentQuestions`. Returns `null`
 * when no pattern still needs review or none can produce a question.
 */
export function createMistakeReviewRound(
  order: string[],
  patterns: MistakePattern[],
  turn: number,
  recentQuestions: string[],
  random?: RandomSource,
): PracticeRound | null {
  const active = new Map(activePatterns(patterns).map((pattern) => [pattern.key, pattern]))
  const rotation = order.filter((key) => active.has(key))

  for (let i = 0; i < rotation.length; i++) {
    const pattern = active.get(rotation[(turn + i) % rotation.length])!
    const similar = generateSimilarQuestion(pattern, { recentQuestions, random })
    if (similar) {
      return { question: similar.question, choices: choicesFor(similar.question) }
    }
  }
  return null
}

/** Whether a session is any kind of mistake review. */
export const isReviewSession = (state: PracticeSessionState) =>
  state.reviewQuestions !== null || state.reviewPatternOrder !== null

/** Keeps only valid questions, e.g. from navigation state that can't be trusted. */
export function validReviewQuestions(value: unknown): Question[] {
  return Array.isArray(value) ? value.filter(isValidQuestion) : []
}

/**
 * The number of questions in the session: the number of review questions in a
 * mistake-review session, `null` for non-stop practice, otherwise the chosen length.
 */
export function getTotalQuestions(
  state: Pick<PracticeSessionState, 'config' | 'reviewQuestions'>,
): number | null {
  if (state.reviewQuestions) return state.reviewQuestions.length
  return state.config.sessionLength === 'continuous' ? null : state.config.sessionLength
}

/** Every question has been attempted. Never true for non-stop practice. */
export function isSessionComplete(state: PracticeSessionState): boolean {
  const total = getTotalQuestions(state)
  return total !== null && state.attempts.length >= total
}

/**
 * Starts a new session with its first question. Pass `reviewQuestions` to re-ask exact
 * questions, or `reviewPatternOrder` for a mistake-review session.
 */
export function startSession(
  config: PracticeConfig,
  round: PracticeRound | null,
  now: number,
  reviewQuestions: Question[] | null = null,
  reviewPatternOrder: string[] | null = null,
): PracticeSessionState {
  return {
    id: createId(),
    config,
    attempts: [],
    startedAt: new Date(now).toISOString(),
    completedAt: null,
    currentQuestionIndex: 0,
    currentRound: round,
    questionShownAt: now,
    correctCount: 0,
    incorrectCount: 0,
    isActive: round !== null,
    reviewQuestions,
    reviewPatternOrder,
  }
}

export type PracticeSessionAction =
  | {
      type: 'recordResult'
      selectedAnswer: number
      markedCorrect: boolean
      timeTakenMs: number
      now: number
    }
  | { type: 'nextQuestion'; round: PracticeRound | null; now: number }
  | { type: 'endSession'; now: number }

/** The current question has a recorded result. */
export function hasRecordedCurrent(state: PracticeSessionState): boolean {
  return state.attempts.length > state.currentQuestionIndex
}

/** The current question is the session's last one (never true for non-stop practice). */
export function isOnLastQuestion(state: PracticeSessionState): boolean {
  const total = getTotalQuestions(state)
  return total !== null && state.currentQuestionIndex >= total - 1
}

/** Updates the session in response to the player. Pure: time and new questions come in the action. */
export function practiceSessionReducer(
  state: PracticeSessionState,
  action: PracticeSessionAction,
): PracticeSessionState {
  if (!state.isActive) return state

  switch (action.type) {
    case 'recordResult': {
      // Only one result per question, however many times this is called.
      if (state.currentRound === null || hasRecordedCurrent(state)) return state

      const attempt: PracticeAttempt = {
        question: state.currentRound.question,
        userAnswer: action.selectedAnswer,
        isCorrect: action.markedCorrect,
        timeTakenMs: action.timeTakenMs,
        answeredAt: new Date(action.now).toISOString(),
      }
      return {
        ...state,
        attempts: [...state.attempts, attempt],
        correctCount: state.correctCount + (action.markedCorrect ? 1 : 0),
        incorrectCount: state.incorrectCount + (action.markedCorrect ? 0 : 1),
      }
    }

    case 'nextQuestion': {
      if (!hasRecordedCurrent(state)) return state
      // Done once the number attempted reaches the session length. No new question is used.
      if (isSessionComplete(state)) {
        return { ...state, isActive: false, completedAt: new Date(action.now).toISOString() }
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentRound: action.round,
        questionShownAt: action.now,
        // Without a question the session can't go on.
        isActive: action.round !== null,
        completedAt: action.round === null ? new Date(action.now).toISOString() : null,
      }
    }

    case 'endSession':
      return { ...state, isActive: false, completedAt: new Date(action.now).toISOString() }
  }
}
