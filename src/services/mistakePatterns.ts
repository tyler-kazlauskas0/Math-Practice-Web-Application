import type { MistakePattern } from '../types/mistake'
import { parseMistakePatterns } from '../utils/mistakePatterns'
import { migrateStorage } from './schema'
import { readJson, writeJson, type WriteResult } from './storage'

export const MISTAKE_PATTERNS_KEY = 'mistake-patterns'

/** Patterns kept. When there are more, the ones not missed for the longest are dropped. */
export const MAX_STORED_PATTERNS = 500

/**
 * Loads saved mistake patterns. Invalid records are skipped and duplicates merged, so broken
 * data never stops the app; if nothing valid is saved this returns an empty list.
 */
export function loadMistakePatterns(): MistakePattern[] {
  migrateStorage()
  const saved = readJson(MISTAKE_PATTERNS_KEY, parseMistakePatterns)
  return saved.status === 'ok' ? saved.value : []
}

/** Saves mistake patterns, keeping the most recently missed if there are too many or storage is full. */
export function saveMistakePatterns(patterns: MistakePattern[]): WriteResult {
  const newestFirst = [...patterns].sort((a, b) =>
    b.lastIncorrectAt.localeCompare(a.lastIncorrectAt),
  )
  const kept = newestFirst.slice(0, MAX_STORED_PATTERNS)
  const result = writeJson(MISTAKE_PATTERNS_KEY, kept)
  if (result.ok || result.reason !== 'quota-exceeded') return result
  return writeJson(MISTAKE_PATTERNS_KEY, kept.slice(0, Math.ceil(kept.length / 2)))
}
