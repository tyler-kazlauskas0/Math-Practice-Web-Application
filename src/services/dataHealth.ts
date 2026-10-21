import { parseActiveSession } from './activeSession'
import { isHistoryArchive, isStoredAttempt, isStoredSession } from './practiceHistory'
import { parseSettings } from './settingsStorage'
import { isMistakePattern } from '../utils/mistakePatterns'
import { logDevError } from '../utils/devLog'
import { readText, removeItem, writeJson } from './storage'

/** The kinds of saved data, named the way the player would recognize them. */
export type DataCategory =
  | 'settings'
  | 'practice sessions'
  | 'answers'
  | 'older statistics'
  | 'mistakes'
  | 'session in progress'

export interface DataRepair {
  category: DataCategory
  /** `reset`: the whole category couldn't be read and was cleared. `cleaned`: only bad records were removed. */
  outcome: 'reset' | 'cleaned'
}

type Check = {
  category: DataCategory
  key: string
} & (
  | { kind: 'list'; isItem: (value: unknown) => boolean }
  | { kind: 'object'; isValid: (value: unknown) => boolean }
  | { kind: 'settings' }
)

const CHECKS: Check[] = [
  { category: 'settings', key: 'settings', kind: 'settings' },
  { category: 'practice sessions', key: 'sessions', kind: 'list', isItem: isStoredSession },
  { category: 'answers', key: 'attempts', kind: 'list', isItem: isStoredAttempt },
  {
    category: 'older statistics',
    key: 'history-archive',
    kind: 'object',
    isValid: isHistoryArchive,
  },
  { category: 'mistakes', key: 'mistake-patterns', kind: 'list', isItem: isMistakePattern },
  {
    category: 'session in progress',
    key: 'active-session',
    kind: 'object',
    isValid: (value) => parseActiveSession(value) !== null,
  },
]

/** Patterns saved before mastery existed have no `masteredAt`; that's not damage. */
const withoutLegacyGaps = (key: string, item: unknown) =>
  key === 'mistake-patterns' && typeof item === 'object' && item !== null && !('masteredAt' in item)
    ? { ...item, masteredAt: null }
    : item

function checkOne(check: Check): DataRepair | null {
  const saved = readText(check.key)
  if (saved.status !== 'ok') return null

  let data: unknown
  try {
    data = JSON.parse(saved.value)
  } catch {
    removeItem(check.key)
    return { category: check.category, outcome: 'reset' }
  }

  switch (check.kind) {
    case 'settings': {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        removeItem(check.key)
        return { category: check.category, outcome: 'reset' }
      }
      // Each bad setting falls back to its default; good ones are kept.
      const repaired = parseSettings(data)
      const record = data as Record<string, unknown>
      const changed = Object.entries(repaired).some(
        ([name, value]) => name in record && JSON.stringify(record[name]) !== JSON.stringify(value),
      )
      if (!changed) return null
      writeJson(check.key, repaired)
      return { category: check.category, outcome: 'cleaned' }
    }
    case 'list': {
      if (!Array.isArray(data)) {
        removeItem(check.key)
        return { category: check.category, outcome: 'reset' }
      }
      const items = data.map((item) => withoutLegacyGaps(check.key, item))
      const valid = items.filter(check.isItem)
      if (valid.length === data.length) return null
      writeJson(check.key, valid)
      return { category: check.category, outcome: 'cleaned' }
    }
    case 'object': {
      if (check.isValid(data)) return null
      removeItem(check.key)
      return { category: check.category, outcome: 'reset' }
    }
  }
}

let startupRepairs: DataRepair[] = []

/**
 * Checks every kind of saved data and repairs what's damaged (e.g. by an old version of the
 * app, or edited by hand). Only the damaged category is touched: bad records are removed,
 * and a category that can't be read at all is reset. Never throws.
 */
export function checkAndRepairStoredData(): DataRepair[] {
  const repairs: DataRepair[] = []
  for (const check of CHECKS) {
    try {
      const repair = checkOne(check)
      if (repair) repairs.push(repair)
    } catch (error) {
      logDevError(`Couldn't check saved ${check.category}`, error)
    }
  }
  if (repairs.length > 0) logDevError('Repaired damaged saved data', repairs)
  startupRepairs = repairs
  return repairs
}

/** What the check at startup repaired, for the notice shown to the player. */
export const getStartupRepairs = () => startupRepairs
