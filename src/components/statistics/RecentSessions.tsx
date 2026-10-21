import type { StoredSession } from '../../services/practiceHistory'
import {
  difficultyLabel,
  formatDateTime,
  formatPercent,
  listNames,
  operationLabel,
} from '../../utils/format'
import { accuracyOf } from '../../utils/statistics'

/** The most recent sessions, newest first, as given. */
function RecentSessions({ sessions }: { sessions: StoredSession[] }) {
  if (sessions.length === 0) {
    return <p className="statistics-empty-note">No sessions yet. Finished sessions show up here.</p>
  }

  return (
    <ol className="session-list">
      {sessions.map((session) => {
        const incorrect = session.totalAttempts - session.correctAttempts
        return (
          <li key={session.id} className="session-row">
            <div className="session-row__main">
              <p className="session-row__date">
                <time dateTime={session.startedAt}>{formatDateTime(session.startedAt)}</time>
                {session.isReview && <span className="tag">Mistake review</span>}
                {session.completedAt === null && <span className="tag">Not finished</span>}
              </p>
              <p className="session-row__details">
                {listNames(session.config.operations.map(operationLabel))} ·{' '}
                {difficultyLabel(session.config.difficulty)}
              </p>
            </div>
            <dl className="session-row__counts">
              <div>
                <dt>Attempted</dt>
                <dd>{session.totalAttempts}</dd>
              </div>
              <div>
                <dt>Right</dt>
                <dd>{session.correctAttempts}</dd>
              </div>
              <div>
                <dt>Wrong</dt>
                <dd>{incorrect}</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>{formatPercent(accuracyOf(session.correctAttempts, session.totalAttempts))}</dd>
              </div>
            </dl>
          </li>
        )
      })}
    </ol>
  )
}

export default RecentSessions
