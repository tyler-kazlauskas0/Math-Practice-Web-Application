import { useReducer } from 'react'
import type { PracticeConfig, PracticeRound } from '../types/session'
import {
  createNextRound,
  createRound,
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

/**
 * Runs a practice session for `config`: holds its state and provides the actions the
 * practice page needs. New questions and timestamps are made here, so the reducer stays pure.
 */
export function usePracticeSession(config: PracticeConfig) {
  const [state, dispatch] = useReducer(practiceSessionReducer, config, (initialConfig) =>
    startSession(
      initialConfig,
      tryCreate(() => createRound(initialConfig)),
      Date.now(),
    ),
  )

  return {
    state,
    recordResult(result: { selectedAnswer: number; markedCorrect: boolean; timeTakenMs: number }) {
      dispatch({ type: 'recordResult', ...result, now: Date.now() })
    },
    nextQuestion() {
      dispatch({
        type: 'nextQuestion',
        round: tryCreate(() => createNextRound(state.config, state.currentRound)),
        now: Date.now(),
      })
    },
    endSession() {
      dispatch({ type: 'endSession', now: Date.now() })
    },
  }
}
