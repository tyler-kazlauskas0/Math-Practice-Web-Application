import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../data/practiceOptions'
import type { DifficultyLevel, MathOperation } from '../types/question'

/** 0.8 → "80%". */
export const formatPercent = (fraction: number) => `${Math.round(fraction * 100)}%`

export const operationLabel = (operation: MathOperation) =>
  OPERATION_OPTIONS.find((option) => option.value === operation)?.label ?? operation

export const difficultyLabel = (difficulty: DifficultyLevel) =>
  DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.label ?? difficulty

/** Joins names into a sentence: "Addition", "Addition and Division", "A, B, and C". */
export function listNames(names: string[]): string {
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

/** A short, readable date and time in the player's own format, e.g. "Oct 21, 2026, 3:05 PM". */
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * A storage size for people, e.g. "about 120 KB" or "about 1.5 MB". Saved data is plain text,
 * so each character is counted as a byte.
 */
export function formatStorageSize(characters: number): string {
  if (characters < 1_000_000) return `about ${Math.max(1, Math.round(characters / 1000))} KB`
  return `about ${(characters / 1_000_000).toFixed(1)} MB`
}

/** A share of something for people: "less than 1%", "3%", "100%". */
export const formatShare = (fraction: number) =>
  fraction > 0 && fraction < 0.005 ? 'less than 1%' : formatPercent(fraction)
