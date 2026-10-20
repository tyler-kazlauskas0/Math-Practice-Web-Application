import type { DifficultyLevel, MathOperation } from './question'

/** Player preferences that control how practice sessions are set up. */
export interface AppSettings {
  /** Operations included when a new session starts. */
  enabledOperations: MathOperation[]
  difficulty: DifficultyLevel
  questionsPerSession: number
  /** Show a timer while answering questions. */
  showTimer: boolean
  soundEnabled: boolean
}
