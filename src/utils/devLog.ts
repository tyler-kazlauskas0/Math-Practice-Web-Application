/**
 * Logs an error to the browser console for developers, in development builds only.
 * Players never see these: the app shows them a friendly message instead.
 */
export function logDevError(message: string, error?: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[Math Practice] ${message}`, ...(error === undefined ? [] : [error]))
  }
}
