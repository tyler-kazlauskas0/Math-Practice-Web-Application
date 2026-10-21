let fallbackCounter = 0

/**
 * Returns a unique ID string. Uses `crypto.randomUUID` when available; it is missing on
 * pages not served over HTTPS (e.g. the dev server opened from another device), so there
 * is a fallback built from the time, a counter, and random characters.
 */
export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  fallbackCounter += 1
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${randomPart}`
}
