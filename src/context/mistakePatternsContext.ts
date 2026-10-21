import { createContext } from 'react'
import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'

export interface MistakePatternsContextValue {
  /** Every saved mistake pattern, loaded when the app starts. */
  patterns: MistakePattern[]
  /** Updates the patterns for one attempt (wrong answers only) and saves them. */
  recordAttempt: (attempt: PracticeAttempt) => void
  /** Forgets all patterns, e.g. after all app data was cleared. */
  clearPatterns: () => void
}

export const MistakePatternsContext = createContext<MistakePatternsContextValue | null>(null)
