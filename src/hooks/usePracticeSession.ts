import { useEffect, useReducer } from 'react'
import { saveAttempt, saveSession, toStoredSession } from '../services/practiceHistory'
import type { Question } from '../types/question'
import type { PracticeConfig, PracticeRound, PracticeSessionState } from '../types/session'
import {
  createNextRound,
  createReviewRound,
  createRound,
  isSessionComplete,
  practiceSessionReducer,
  startSession,
} from '../utils/practiceSession'

function tryCreate(make: () => PracticeRound): PracticeRound | null {
  try {
    return make()
  } catch {
    return null
  }
}

/** Makes the next question: the next saved one in a review, otherwise a new random one. */
function makeNextRound(state: PracticeSessionState): PracticeRound | null {
  if (state.reviewQuestions) {
    const question = state.reviewQuestions[state.currentQuestionIndex + 1]
    return question ? tryCreate(() => createReviewRound(question)) : null
  }
  return tryCreate(() => createNextRound(state.config, state.currentRound))
}

/**
 * Runs a practice session for `config`: holds its state and provides the actions the
 * practice page needs. New questions and timestamps are made here, so the reducer stays pure.
 * Pass `reviewQuestions` to ask those questions again instead of new ones.
 */
export function usePracticeSession(
  config: PracticeConfig,
  reviewQuestions: Question[] | null = null,
) {
  const [state, dispatch] = useReducer(practiceSessionReducer, null, () => {
    const first = reviewQuestions
      ? tryCreate(() => createReviewRound(reviewQuestions[0]))
      : tryCreate(() => createRound(config))
    return startSession(config, first, Date.now(), reviewQuestions)
  })

  // Save each answer as soon as it's recorded, and keep the session record up to date, so
  // nothing is lost if the browser is closed mid-session. Sessions with no answers aren't saved.
  useEffect(() => {
    const latest = state.attempts.at(-1)
    if (!latest) return
    saveAttempt({ ...latest, sessionId: state.id })
    saveSession(toStoredSession(state))
  }, [state])

  return {
    state,
    recordResult(result: { selectedAnswer: number; markedCorrect: boolean; timeTakenMs: number }) {
      dispatch({ type: 'recordResult', ...result, now: Date.now() })
    },
    nextQuestion() {
      dispatch({
        type: 'nextQuestion',
        // Once the session is complete there is no next question to make.
        round: isSessionComplete(state) ? null : makeNextRound(state),
        now: Date.now(),
      })
    },
    endSession() {
      dispatch({ type: 'endSession', now: Date.now() })
    },
  }
}
