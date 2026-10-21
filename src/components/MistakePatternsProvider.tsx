import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { MistakePatternsContext } from '../context/mistakePatternsContext'
import { loadMistakePatterns, saveMistakePatterns } from '../services/mistakePatterns'
import type { PracticeAttempt } from '../types/session'
import { recordMistake } from '../utils/mistakePatterns'

/** Loads mistake patterns when the app starts and shares them through `useMistakePatterns`. */
function MistakePatternsProvider({ children }: { children: ReactNode }) {
  const [patterns, setPatterns] = useState(loadMistakePatterns)

  // Stable functions, so components that depend on them don't re-run their effects needlessly.
  const recordAttempt = useCallback((attempt: PracticeAttempt) => {
    if (attempt.isCorrect) return
    // Work from what is saved, so patterns recorded elsewhere (e.g. another tab) aren't lost.
    const next = recordMistake(loadMistakePatterns(), attempt)
    saveMistakePatterns(next)
    setPatterns(next)
  }, [])
  const clearPatterns = useCallback(() => setPatterns([]), [])
  const value = useMemo(
    () => ({ patterns, recordAttempt, clearPatterns }),
    [patterns, recordAttempt, clearPatterns],
  )

  return <MistakePatternsContext.Provider value={value}>{children}</MistakePatternsContext.Provider>
}

export default MistakePatternsProvider
