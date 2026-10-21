import { useState } from 'react'
import {
  clearPracticeHistory,
  countStoredSessions,
  loadArchive,
  loadAttempts,
  loadRecentSessions,
} from '../services/practiceHistory'
import { calculateStatistics } from '../utils/statistics'

/** How many sessions the Recent Sessions list shows. */
export const RECENT_SESSION_COUNT = 10

function loadStatistics() {
  return {
    statistics: calculateStatistics(loadAttempts(), countStoredSessions(), loadArchive()),
    recentSessions: loadRecentSessions(RECENT_SESSION_COUNT),
  }
}

/** Loads saved practice history for the Statistics page, and lets it be reset. */
export function useStatistics() {
  const [data, setData] = useState(loadStatistics)

  return {
    ...data,
    /** Deletes all practice history and reloads the (now empty) statistics. */
    resetStatistics() {
      clearPracticeHistory()
      setData(loadStatistics())
    },
  }
}
