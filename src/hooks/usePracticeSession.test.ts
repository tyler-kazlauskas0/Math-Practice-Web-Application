import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PracticeConfig } from '../types/session'
import * as practiceSession from '../utils/practiceSession'
import MistakePatternsProvider from '../components/MistakePatternsProvider'
import { usePracticeSession } from './usePracticeSession'

vi.mock('../utils/practiceSession', { spy: true })

const config: PracticeConfig = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }
const result = { selectedAnswer: 1, markedCorrect: true, timeTakenMs: 1000 }

describe('usePracticeSession', () => {
  it('stops generating questions once the session is complete', () => {
    const { result: hook } = renderHook(() => usePracticeSession(config), {
      wrapper: MistakePatternsProvider,
    })

    for (let i = 0; i < 5; i++) {
      act(() => hook.current.recordResult(result))
      act(() => hook.current.nextQuestion())
    }

    // Four new questions after the first; none after the fifth is answered.
    expect(practiceSession.createNextRound).toHaveBeenCalledTimes(4)
    expect(hook.current.state.isActive).toBe(false)
    expect(hook.current.state.completedAt).toEqual(expect.any(String))
  })
})
