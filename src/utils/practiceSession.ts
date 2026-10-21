import type {
  PracticeAttempt,
  PracticeConfig,
  PracticeRound,
  PracticeSessionState,
} from '../types/session'
import { createId } from './id'
import { createAnswerChoices } from './questions/answerChoices'
import { generatePracticeQuestion } from './questions/generateQuestion'

/** How many times to try for a question that differs from the previous one. */
const MAX_REPEAT_ATTEMPTS = 10

/** Creates a question and its answer choices. Throws if no valid question can be made. */
export function createRound(config: PracticeConfig): PracticeRound {
  const question = generatePracticeQuestion(config.operations, config.difficulty)
  return { question, choices: createAnswerChoices(question) }
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

/** The number of questions in the session, or `null` for non-stop practice. */
export function getTotalQuestions(config: PracticeConfig): number | null {
  return config.sessionLength === 'continuous' ? null : config.sessionLength
}

/** Starts a new session with its first question. */
export function startSession(
  config: PracticeConfig,
  round: PracticeRound | null,
  now: number,
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

/** The session has asked all of its questions (never true for non-stop practice). */
export function isOnLastQuestion(state: PracticeSessionState): boolean {
  const total = getTotalQuestions(state.config)
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
      if (isOnLastQuestion(state)) {
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
