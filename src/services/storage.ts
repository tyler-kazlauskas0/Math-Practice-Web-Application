/**
 * A small, safe wrapper around `localStorage`. Every function handles storage being
 * unavailable (e.g. blocked in private browsing), full, or holding broken data, so callers
 * get a result to check instead of an exception.
 *
 * All keys are prefixed with `math-practice:` so this app never touches other data stored
 * on the same site.
 */

export const STORAGE_PREFIX = 'math-practice:'

export type ReadResult<T> =
  | { status: 'ok'; value: T }
  /** Nothing has been saved under this key. */
  | { status: 'missing' }
  /** Storage can't be used, e.g. blocked by the browser. */
  | { status: 'unavailable' }
  /** Something is saved but it isn't valid JSON, or it failed validation. */
  | { status: 'invalid' }

export type WriteResult =
  { ok: true } | { ok: false; reason: 'unavailable' | 'quota-exceeded' | 'unknown' }

/** Why saving failed: storage is blocked (e.g. some private-browsing modes) or full. */
export type StorageProblem = 'unavailable' | 'quota-exceeded'

const problemListeners = new Set<(problem: StorageProblem) => void>()

/**
 * Calls `listener` whenever saving fails because storage is blocked or full, so the app can
 * explain it to the player. Returns a function that stops listening.
 */
export function onStorageProblem(listener: (problem: StorageProblem) => void): () => void {
  problemListeners.add(listener)
  return () => problemListeners.delete(listener)
}

function reportProblem(problem: StorageProblem) {
  problemListeners.forEach((listener) => listener(problem))
}

/** Turns parsed JSON into the expected type, or returns `null` if it doesn't fit. */
export type Parser<T> = (data: unknown) => T | null

function getStorage(): Storage | null {
  try {
    // Simply reading `window.localStorage` can throw when storage is blocked.
    const storage = window.localStorage
    storage.getItem(`${STORAGE_PREFIX}availability-check`)
    return storage
  } catch {
    return null
  }
}

/** Detects the "storage is full" error, which browsers report in slightly different ways. */
export function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

/** Whether browser storage can be used at all. */
export function isStorageAvailable(): boolean {
  return getStorage() !== null
}

/** Reads a raw string. */
export function readText(key: string): ReadResult<string> {
  const storage = getStorage()
  if (!storage) return { status: 'unavailable' }
  try {
    const value = storage.getItem(STORAGE_PREFIX + key)
    return value === null ? { status: 'missing' } : { status: 'ok', value }
  } catch {
    return { status: 'unavailable' }
  }
}

/** Writes a raw string. */
export function writeText(key: string, value: string): WriteResult {
  const storage = getStorage()
  if (!storage) {
    reportProblem('unavailable')
    return { ok: false, reason: 'unavailable' }
  }
  try {
    storage.setItem(STORAGE_PREFIX + key, value)
    return { ok: true }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      reportProblem('quota-exceeded')
      return { ok: false, reason: 'quota-exceeded' }
    }
    return { ok: false, reason: 'unknown' }
  }
}

/** Reads JSON and checks it with `parse`. Broken JSON or failed validation gives `invalid`. */
export function readJson<T>(key: string, parse: Parser<T>): ReadResult<T> {
  const text = readText(key)
  if (text.status !== 'ok') return text
  try {
    const value = parse(JSON.parse(text.value))
    return value === null ? { status: 'invalid' } : { status: 'ok', value }
  } catch {
    return { status: 'invalid' }
  }
}

/** Saves a value as JSON. */
export function writeJson(key: string, value: unknown): WriteResult {
  let text: string
  try {
    text = JSON.stringify(value)
  } catch {
    return { ok: false, reason: 'unknown' }
  }
  return writeText(key, text)
}

/**
 * Removes everything this app has saved (every `math-practice:` key), including any keys
 * added in the future. Data from other apps on the same site is left alone.
 */
export function clearAllAppData(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    // Collect first: removing while looping over `storage.key(i)` would skip keys.
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(
      (key): key is string => key !== null && key.startsWith(STORAGE_PREFIX),
    )
    keys.forEach((key) => storage.removeItem(key))
  } catch {
    // Nothing to do: the data simply stays.
  }
}

/** Removes one of this app's keys. Other data is never touched. */
export function removeItem(key: string): void {
  try {
    getStorage()?.removeItem(STORAGE_PREFIX + key)
  } catch {
    // Nothing to do: the data simply stays.
  }
}
