/** URL paths for every page in the app. Use these instead of hard-coding paths. */
export const ROUTES = {
  home: '/',
  practiceSetup: '/practice/setup',
  practiceSession: '/practice/session',
  practiceSummary: '/practice/summary',
  statistics: '/statistics',
  mistakes: '/statistics/mistakes',
  settings: '/settings',
} as const

/** Navigation state the setup page receives when the player was sent back from a missing session. */
export const MISSING_SESSION_REASON = 'missing-session'

/** Navigation state the home page receives after all app data was cleared. */
export const DATA_CLEARED_REASON = 'data-cleared'
