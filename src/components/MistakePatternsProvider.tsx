import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { MistakePatternsContext } from '../context/mistakePatternsContext'
import { useSettings } from '../hooks/useSettings'
import { loadMistakePatterns, saveMistakePatterns } from '../services/mistakePatterns'
import type { PracticeAttempt } from '../types/session'
import { applyAttempt } from '../utils/mistakePatterns'

/** Loads mistake patterns when the app starts and shares them through `useMistakePatterns`. */
function MistakePatternsProvider({ children }: { children: ReactNode }) {
  const [patterns, setPatterns] = useState(loadMistakePatterns)
  const { masteryThreshold } = useSettings().settings

  // Stable functions, so components that depend on them don't re-run their effects needlessly.
  const recordAttempt = useCallback(
    (attempt: PracticeAttempt) => {
      // Work from what is saved, so patterns recorded elsewhere (e.g. another tab) aren't lost.
      const saved = loadMistakePatterns()
      const next = applyAttempt(saved, attempt, masteryThreshold)
      if (next === saved) return
      saveMistakePatterns(next)
      setPatterns(next)
    },
    [masteryThreshold],
  )
  const clearPatterns = useCallback(() => setPatterns([]), [])
  const value = useMemo(
    () => ({ patterns, recordAttempt, clearPatterns }),
    [patterns, recordAttempt, clearPatterns],
  )

  return <MistakePatternsContext.Provider value={value}>{children}</MistakePatternsContext.Provider>
}

export default MistakePatternsProvider
