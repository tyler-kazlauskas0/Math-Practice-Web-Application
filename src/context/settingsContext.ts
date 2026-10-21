import { createContext } from 'react'
import type { AppSettings } from '../types/settings'

export interface SettingsContextValue {
  settings: AppSettings
  /** Changes some settings and saves them. */
  updateSettings: (changes: Partial<AppSettings>) => void
  /** Puts every setting back to its default and saves that. */
  resetSettings: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
