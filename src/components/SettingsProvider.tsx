import { useEffect, useState, type ReactNode } from 'react'
import { SettingsContext } from '../context/settingsContext'
import type { AppSettings } from '../types/settings'
import { loadSettings, saveSettings } from '../services/settingsStorage'

/** Loads the player's settings and makes them available to the whole app through `useSettings`. */
function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  function updateSettings(changes: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...changes }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export default SettingsProvider
