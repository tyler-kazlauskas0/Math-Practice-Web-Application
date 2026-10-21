import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import { loadSettings, parseSettings, saveSettings, SETTINGS_STORAGE_KEY } from './settingsStorage'

describe('parseSettings', () => {
  it('keeps valid saved values', () => {
    const saved = {
      ...DEFAULT_SETTINGS,
      enabledOperations: ['division'],
      difficulty: 'advanced',
      sessionLength: 'continuous',
      animationsEnabled: false,
      showExplanations: false,
    }
    expect(parseSettings(saved)).toEqual(saved)
  })

  it('uses defaults for missing or invalid values', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings({ animationsEnabled: 'no', difficulty: 'impossible' })).toEqual(
      DEFAULT_SETTINGS,
    )
    expect(parseSettings({ animationsEnabled: false })).toEqual({
      ...DEFAULT_SETTINGS,
      animationsEnabled: false,
    })
  })
})

describe('loadSettings and saveSettings', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('saves and loads settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, animationsEnabled: false })
    expect(loadSettings().animationsEnabled).toBe(false)
  })

  it('returns defaults when nothing is saved or the saved data is broken', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow()
  })
})
