import { useEffect, useReducer } from 'react'
import { saveAttempt, saveSession, toStoredSession } from '../services/practiceHistory'
import type { MistakePattern } from '../types/mistake'
import type { Question } from '../types/question'
import type { PracticeConfig, PracticeRound, PracticeSessionState } from '../types/session'
import { prioritizePatterns } from '../utils/mistakePriority'
import {
  createMistakeReviewRound,
  createNextRound,
  createReviewRound,
  createRound,
  isSessionComplete,
  practiceSessionReducer,
  startSession,
} from '../utils/practiceSession'
import { useMistakePatterns } from './useMistakePatterns'
import { useSettings } from './useSettings'

function tryCreate(make: () => PracticeRound | null): PracticeRound | null {
  try {
    return make()
  } catch {
    return null
  }
}

/** How many recent questions a mistake review tries not to repeat. */
const RECENT_QUESTION_MEMORY = 4

const recentQuestionsOf = (state: PracticeSessionState) =>
  [
    ...state.attempts.map((attempt) => attempt.question.displayText),
    state.currentRound?.question.displayText ?? '',
  ].slice(-RECENT_QUESTION_MEMORY)

/**
 * Makes the next question: the next saved one when re-asking exact questions, a question
 * related to the next mistake pattern in a mistake review, otherwise a new random one.
 */
function makeNextRound(
  state: PracticeSessionState,
  patterns: MistakePattern[],
): PracticeRound | null {
  if (state.reviewQuestions) {
    const question = state.reviewQuestions[state.currentQuestionIndex + 1]
    return question ? tryCreate(() => createReviewRound(question)) : null
  }
  if (state.reviewPatternOrder) {
    return tryCreate(() =>
      createMistakeReviewRound(
        state.reviewPatternOrder!,
        patterns,
        state.currentQuestionIndex + 1,
        recentQuestionsOf(state),
      ),
    )
  }
  return tryCreate(() => createNextRound(state.config, state.currentRound))
}

export interface PracticeSessionOptions {
  /** Re-ask these exact questions instead of making new ones. */
  reviewQuestions?: Question[] | null
  /** Ask questions related to the player's saved mistakes. */
  mistakeReview?: boolean
  /** Continue this saved session (e.g. after a page refresh) instead of starting a new one. */
  restored?: PracticeSessionState | null
}

/**
 * Runs a practice session for `config`: holds its state and provides the actions the
 * practice page needs. New questions and timestamps are made here, so the reducer stays pure.
 */
export function usePracticeSession(
  config: PracticeConfig,
  { reviewQuestions = null, mistakeReview = false, restored = null }: PracticeSessionOptions = {},
) {
  const { patterns, recordAttempt } = useMistakePatterns()
  const { masteryThreshold } = useSettings().settings
  const [state, dispatch] = useReducer(practiceSessionReducer, null, () => {
    if (restored) return restored
    const now = Date.now()
    if (mistakeReview) {
      const order = prioritizePatterns(patterns, { now, threshold: masteryThreshold }).map(
        (pattern) => pattern.key,
      )
      const first = tryCreate(() => createMistakeReviewRound(order, patterns, 0, []))
      return startSession(config, first, now, null, order)
    }
    const first = reviewQuestions
      ? tryCreate(() => createReviewRound(reviewQuestions[0]))
      : tryCreate(() => createRound(config))
    return startSession(config, first, now, reviewQuestions)
  })

  // Save each answer as soon as it's recorded, and keep the session record up to date, so
  // nothing is lost if the browser is closed mid-session. Sessions with no answers aren't saved.
  // Each new answer also updates the mistake patterns, once (this effect can run more than once).
  useEffect(() => {
    const latest = state.attempts.at(-1)
    if (!latest) return
    const saved = saveAttempt({ ...latest, sessionId: state.id })
    if (saved.isNew) recordAttempt(latest)
    saveSession(toStoredSession(state))
  }, [state, recordAttempt])

  return {
    state,
    recordResult(result: { selectedAnswer: number; markedCorrect: boolean; timeTakenMs: number }) {
      dispatch({ type: 'recordResult', ...result, now: Date.now() })
    },
    nextQuestion() {
      const now = Date.now()
      // Once the session is complete there is no next question to make.
      if (isSessionComplete(state)) {
        dispatch({ type: 'nextQuestion', round: null, now })
        return
      }
      const round = makeNextRound(state, patterns)
      // A mistake review ends early when every mistake in it has been mastered.
      if (round === null && state.reviewPatternOrder) {
        dispatch({ type: 'endSession', now })
        return
      }
      dispatch({ type: 'nextQuestion', round, now })
    },
    endSession() {
      dispatch({ type: 'endSession', now: Date.now() })
    },
  }
}
