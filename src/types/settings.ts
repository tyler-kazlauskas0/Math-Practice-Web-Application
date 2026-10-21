import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

/** Player preferences that control how practice sessions are set up. */
export interface AppSettings {
  /** Operations included when a new session starts. */
  enabledOperations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  /** Show a timer while answering questions. */
  showTimer: boolean
  soundEnabled: boolean
  /** Show an encouraging message (with a little pop) after each answer is marked. */
  feedbackEnabled: boolean
  /** Show a short explanation of the answer on the back of the question card. */
  showExplanations: boolean
  /** Related questions answered correctly in a row needed to master a mistake (2–5). */
  masteryThreshold: number
  /** Animate the question card when it flips. Animations are also skipped if the device asks for reduced motion. */
  animationsEnabled: boolean
}
