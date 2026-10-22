import { useState } from 'react'
import {
  clearPracticeHistory,
  countStoredSessions,
  loadArchive,
  loadAttempts,
  loadRecentSessions,
} from '../services/practiceHistory'
import type { MistakePattern } from '../types/mistake'
import { summarizeMistakes } from '../utils/mistakeStatistics'
import { calculateStatistics } from '../utils/statistics'
import { useMistakePatterns } from './useMistakePatterns'

/** How many sessions the Recent Sessions list shows. */
export const RECENT_SESSION_COUNT = 10

function loadStatistics(patterns: MistakePattern[]) {
  const attempts = loadAttempts()
  const archive = loadArchive()
  return {
    statistics: calculateStatistics(attempts, countStoredSessions(), archive),
    recentSessions: loadRecentSessions(RECENT_SESSION_COUNT),
    mistakeSummary: summarizeMistakes(patterns, attempts, archive.review),
  }
}

/** Loads saved practice history for the Statistics page, and lets it be reset. */
export function useStatistics() {
  const { patterns } = useMistakePatterns()
  const [data, setData] = useState(() => loadStatistics(patterns))

  return {
    ...data,
    /** Every saved mistake pattern, mastered or not. */
    patterns,
    /** Deletes all practice history and reloads the (now empty) statistics. */
    resetStatistics() {
      clearPracticeHistory()
      setData(loadStatistics(patterns))
    },
  }
}
