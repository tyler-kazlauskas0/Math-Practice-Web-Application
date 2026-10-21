import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import type { AppSettings } from '../types/settings'
import { isPracticeConfig } from './practiceConfig'

/** The browser storage key settings are saved under. */
export const SETTINGS_STORAGE_KEY = 'math-practice:settings'

/**
 * Turns saved data into settings. Each field that is missing or invalid (e.g. from an older
 * version of the app, or edited by hand) falls back to its default, so bad data never breaks the app.
 */
export function parseSettings(saved: unknown): AppSettings {
  if (typeof saved !== 'object' || saved === null) return DEFAULT_SETTINGS
  const data = saved as Record<string, unknown>
  const boolean = (key: 'showTimer' | 'soundEnabled' | 'animationsEnabled') =>
    typeof data[key] === 'boolean' ? data[key] : DEFAULT_SETTINGS[key]

  const practice = {
    operations: data.enabledOperations,
    difficulty: data.difficulty,
    sessionLength: data.sessionLength,
  }
  const practiceSettings = isPracticeConfig(practice)
    ? {
        enabledOperations: practice.operations,
        difficulty: practice.difficulty,
        sessionLength: practice.sessionLength,
      }
    : {}

  return {
    ...DEFAULT_SETTINGS,
    ...practiceSettings,
    showTimer: boolean('showTimer'),
    soundEnabled: boolean('soundEnabled'),
    animationsEnabled: boolean('animationsEnabled'),
  }
}

/** Reads settings from browser storage. Returns the defaults if storage is empty or unavailable. */
export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return saved === null ? DEFAULT_SETTINGS : parseSettings(JSON.parse(saved))
  } catch {
    // Storage can be blocked (e.g. private browsing) or hold invalid JSON.
    return DEFAULT_SETTINGS
  }
}

/** Saves settings to browser storage. Does nothing if storage is unavailable. */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Settings still work for this visit; they just won't be remembered.
  }
}
