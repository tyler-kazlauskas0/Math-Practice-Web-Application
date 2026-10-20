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
}
