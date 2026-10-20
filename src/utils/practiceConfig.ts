import {
  DIFFICULTY_OPTIONS,
  OPERATION_OPTIONS,
  SESSION_LENGTH_OPTIONS,
} from '../data/practiceOptions'
import type { PracticeConfig } from '../types/session'

/**
 * Checks that a value is a usable practice configuration. Used on data the app can't
 * trust, such as navigation state after the player opens the session page directly.
 */
export function isPracticeConfig(value: unknown): value is PracticeConfig {
  if (typeof value !== 'object' || value === null) return false
  const { operations, difficulty, sessionLength } = value as Record<string, unknown>

  return (
    Array.isArray(operations) &&
    operations.length > 0 &&
    operations.every((op) => OPERATION_OPTIONS.some((option) => option.value === op)) &&
    DIFFICULTY_OPTIONS.some((option) => option.value === difficulty) &&
    SESSION_LENGTH_OPTIONS.some((option) => option.value === sessionLength)
  )
}
