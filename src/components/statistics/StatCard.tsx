import { useId } from 'react'
import type { AttemptStatistics } from '../../types/statistics'
import { formatPercent } from '../../utils/format'

interface StatCardProps {
  title: string
  /** A large symbol shown beside the title, e.g. `+`. */
  icon?: string
  description?: string
  stats: AttemptStatistics
}

/** One operation's or difficulty level's results: accuracy, plus attempted, right, and wrong. */
function StatCard({ title, icon, description, stats }: StatCardProps) {
  const headingId = useId()

  return (
    <article className="stat-card" aria-labelledby={headingId}>
      <header className="stat-card__header">
        {icon && (
          <span className="stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div>
          <h3 id={headingId} className="stat-card__title">
            {title}
          </h3>
          {description && <p className="stat-card__description">{description}</p>}
        </div>
      </header>

      {stats.totalAttempts === 0 ? (
        <p className="stat-card__empty">Not practiced yet</p>
      ) : (
        <>
          <p className="stat-card__accuracy">
            <span className="stat-card__accuracy-value">{formatPercent(stats.accuracy)}</span>{' '}
            accuracy
          </p>
          <div className="stat-card__meter" aria-hidden="true">
            <div
              className="stat-card__meter-fill"
              style={{ width: formatPercent(stats.accuracy) }}
            />
          </div>
          <dl className="stat-card__counts">
            <div>
              <dt>Attempted</dt>
              <dd>{stats.totalAttempts}</dd>
            </div>
            <div>
              <dt>Right</dt>
              <dd>{stats.correctAttempts}</dd>
            </div>
            <div>
              <dt>Wrong</dt>
              <dd>{stats.incorrectAttempts}</dd>
            </div>
          </dl>
        </>
      )}
    </article>
  )
}

export default StatCard
