import { memo } from 'react'

interface SessionProgressProps {
  answered: number
  /** `null` for non-stop practice, which shows a running count instead of a bar. */
  total: number | null
  correct: number
}

/** A progress bar for fixed-length sessions, or a running count for non-stop practice. */
function SessionProgress({ answered, total, correct }: SessionProgressProps) {
  const plural = (count: number) => (count === 1 ? 'question' : 'questions')

  if (total === null) {
    return (
      <p className="session-progress__count">
        {answered} {plural(answered)} answered · {correct} right
      </p>
    )
  }

  const percent = Math.round((answered / total) * 100)
  return (
    <div className="session-progress">
      <div
        className="session-progress__track"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-valuetext={`${answered} of ${total} questions answered`}
      >
        <div className="session-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="session-progress__label" aria-hidden="true">
        {answered} of {total} answered
      </p>
    </div>
  )
}

export default memo(SessionProgress)
