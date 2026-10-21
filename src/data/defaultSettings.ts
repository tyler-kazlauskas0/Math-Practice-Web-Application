import type { AppSettings } from '../types/settings'
import { DEFAULT_MASTERY_THRESHOLD } from '../utils/mistakePatterns'
import { DEFAULT_PRACTICE_CONFIG } from './practiceOptions'

/** Settings used on first visit, and for any saved value that is missing or invalid. */
export const DEFAULT_SETTINGS: AppSettings = {
  enabledOperations: DEFAULT_PRACTICE_CONFIG.operations,
  difficulty: DEFAULT_PRACTICE_CONFIG.difficulty,
  sessionLength: DEFAULT_PRACTICE_CONFIG.sessionLength,
  showTimer: false,
  soundEnabled: true,
  showExplanations: true,
  feedbackEnabled: true,
  masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
  animationsEnabled: true,
}
