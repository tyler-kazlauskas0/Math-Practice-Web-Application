import { createContext } from 'react'
import type { AppSettings } from '../types/settings'

export interface SettingsContextValue {
  settings: AppSettings
  /** Changes some settings and saves them. */
  updateSettings: (changes: Partial<AppSettings>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
