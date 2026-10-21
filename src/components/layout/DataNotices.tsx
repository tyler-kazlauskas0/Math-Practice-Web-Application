import { useEffect, useState } from 'react'
import { getStartupRepairs, type DataRepair } from '../../services/dataHealth'
import { onStorageProblem, type StorageProblem } from '../../services/storage'
import { listNames } from '../../utils/format'
import Button from '../ui/Button'

const STORAGE_MESSAGES: Record<StorageProblem, string> = {
  unavailable:
    'This browser isn’t letting the app save anything (this can happen in private browsing). You can keep practicing, but your progress won’t be kept after you close the app.',
  'quota-exceeded':
    'This device is out of space for saving practice. Your newest answers might not be kept. Resetting your statistics in Statistics would free up space.',
}

function repairMessage(repairs: DataRepair[]): string {
  const reset = repairs.filter((r) => r.outcome === 'reset').map((r) => `your ${r.category}`)
  const cleaned = repairs.filter((r) => r.outcome === 'cleaned').map((r) => `your ${r.category}`)
  const parts = [
    reset.length > 0 && `${listNames(reset)} had to be started fresh`,
    cleaned.length > 0 && `a few damaged entries were removed from ${listNames(cleaned)}`,
  ].filter(Boolean)
  return `Some saved data couldn’t be read, so ${parts.join(', and ')}. Everything else is just as you left it.`
}

/**
 * Plain-language notices about saved data: repairs made when the app started, and saves that
 * fail because storage is blocked or full. Each can be dismissed.
 */
function DataNotices() {
  const [repairs, setRepairs] = useState(getStartupRepairs)
  const [problem, setProblem] = useState<StorageProblem | null>(null)
  const [dismissedProblems, setDismissedProblems] = useState<StorageProblem[]>([])

  useEffect(() => onStorageProblem(setProblem), [])

  const showProblem = problem !== null && !dismissedProblems.includes(problem)
  if (repairs.length === 0 && !showProblem) return null

  return (
    <div className="data-notices">
      {repairs.length > 0 && (
        <div className="data-notice" role="status">
          <p>{repairMessage(repairs)}</p>
          <Button variant="secondary" onClick={() => setRepairs([])}>
            OK
          </Button>
        </div>
      )}
      {showProblem && (
        <div className="data-notice" role="alert">
          <p>{STORAGE_MESSAGES[problem]}</p>
          <Button
            variant="secondary"
            onClick={() => setDismissedProblems((dismissed) => [...dismissed, problem])}
          >
            OK
          </Button>
        </div>
      )}
    </div>
  )
}

export default DataNotices
