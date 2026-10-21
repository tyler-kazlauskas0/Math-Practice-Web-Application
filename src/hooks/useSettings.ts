import { useContext } from 'react'
import { SettingsContext, type SettingsContextValue } from '../context/settingsContext'

/** Returns the player's settings and a function to change them. Must be used inside `SettingsProvider`. */
export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (!value) {
    throw new Error('useSettings must be used inside SettingsProvider')
  }
  return value
}
