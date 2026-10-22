import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SettingsContext } from '../context/settingsContext'
import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import type { AppSettings } from '../types/settings'
import { loadSettings, saveSettings } from '../services/settingsStorage'

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Loads the player's settings and makes them available to the whole app through `useSettings`. */
function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadSettings)
  const [settings, setSettings] = useState(loaded)

  // Save only real changes, not the settings just loaded.
  useEffect(() => {
    if (settings !== loaded) saveSettings(settings)
  }, [settings, loaded])

  // A change that sets the same values keeps the same settings object, so nothing that uses
  // the settings re-renders and nothing is saved.
  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    setSettings((current) => {
      const changed = Object.entries(changes).some(
        ([name, value]) => !sameValue(current[name as keyof AppSettings], value),
      )
      return changed ? { ...current, ...changes } : current
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings((current) => (sameValue(current, DEFAULT_SETTINGS) ? current : DEFAULT_SETTINGS))
  }, [])

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export default SettingsProvider
