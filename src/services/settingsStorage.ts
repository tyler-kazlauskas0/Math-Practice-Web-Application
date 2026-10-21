import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import { migrateStorage } from './schema'
import { readJson, STORAGE_PREFIX, writeJson } from './storage'
import type { AppSettings } from '../types/settings'
import { isPracticeConfig } from '../utils/practiceConfig'

const SETTINGS_KEY = 'settings'

/** The full browser storage key settings are saved under. */
export const SETTINGS_STORAGE_KEY = STORAGE_PREFIX + SETTINGS_KEY

/**
 * Turns saved data into settings. Each field that is missing or invalid (e.g. from an older
 * version of the app, or edited by hand) falls back to its default, so bad data never breaks the app.
 */
export function parseSettings(saved: unknown): AppSettings {
  if (typeof saved !== 'object' || saved === null) return DEFAULT_SETTINGS
  const data = saved as Record<string, unknown>
  const boolean = (key: 'showTimer' | 'soundEnabled' | 'showExplanations' | 'animationsEnabled') =>
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
    showExplanations: boolean('showExplanations'),
    animationsEnabled: boolean('animationsEnabled'),
  }
}

/** Reads settings from browser storage. Returns the defaults if none are saved, storage is
 * unavailable, or the saved data is broken. */
export function loadSettings(): AppSettings {
  migrateStorage()
  const saved = readJson(SETTINGS_KEY, parseSettings)
  return saved.status === 'ok' ? saved.value : DEFAULT_SETTINGS
}

/** Saves settings to browser storage. Settings still work for this visit if saving fails. */
export function saveSettings(settings: AppSettings): void {
  writeJson(SETTINGS_KEY, settings)
}
