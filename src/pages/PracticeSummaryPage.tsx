import { useLocation } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import '../components/session/session.css'
import Button from '../components/ui/Button'
import ButtonLink from '../components/ui/ButtonLink'
import StatTiles from '../components/ui/StatTiles'
import { ROUTES } from '../data/routes'
import { useSettings } from '../hooks/useSettings'
import type { PracticeSessionRequest } from '../types/session'
import type { SessionSummary } from '../types/statistics'
import {
  difficultyLabel,
  formatPercent as percent,
  listNames,
  operationLabel,
} from '../utils/format'
import { summaryFeedback } from '../utils/feedback'
import { isSessionSummary } from '../utils/sessionSummary'

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

function SummaryActions({ summary }: { summary: SessionSummary }) {
  const mistakeCount = summary.mistakes.length
  const reviewRequest: PracticeSessionRequest = {
    ...summary.config,
    reviewQuestions: summary.mistakes,
  }
  // After a mistake review, Practice Again reviews mistakes again.
  const againRequest: PracticeSessionRequest = summary.mistakeReview
    ? { ...summary.config, mode: 'mistake-review' }
    : summary.config

  return (
    <div className="summary-actions">
      <ButtonLink to={ROUTES.practiceSession} state={againRequest}>
        Practice Again
      </ButtonLink>
      {mistakeCount > 0 ? (
        <ButtonLink to={ROUTES.practiceSession} state={reviewRequest} variant="secondary">
          Practice Mistakes ({mistakeCount})
        </ButtonLink>
      ) : (
        <Button variant="secondary" disabled aria-describedby="no-mistakes">
          Practice Mistakes
        </Button>
      )}
      <ButtonLink to={ROUTES.practiceSetup} state={{ config: summary.config }} variant="secondary">
        Change Settings
      </ButtonLink>
      <ButtonLink to={ROUTES.statistics} variant="secondary">
        View Statistics
      </ButtonLink>
      <ButtonLink to={ROUTES.home} variant="secondary">
        Return Home
      </ButtonLink>
      {mistakeCount === 0 && (
        <p id="no-mistakes" className="summary-actions__note">
          No mistakes to practice. Great job!
        </p>
      )}
    </div>
  )
}

function PracticeSummaryPage() {
  const { state: summary } = useLocation()
  const { feedbackEnabled } = useSettings().settings

  if (!isSessionSummary(summary)) {
    return (
      <PageContainer title="Practice Summary">
        <p>There’s no finished session to show yet.</p>
        <ButtonLink to={ROUTES.practiceSetup}>Start Practicing</ButtonLink>
      </PageContainer>
    )
  }

  if (summary.totalAttempts === 0) {
    return (
      <PageContainer title="Session Ended">
        <p>You didn’t answer any questions this time. Ready to try again?</p>
        <SummaryActions summary={summary} />
      </PageContainer>
    )
  }

  const difficulty = difficultyLabel(summary.config.difficulty)
  const operations = listNames(summary.byOperation.map((stats) => operationLabel(stats.operation)))

  return (
    <PageContainer title={summary.isReview ? 'Mistake Review Done!' : 'Great Practice!'}>
      <p className="summary-intro">
        You practiced <strong>{operations}</strong> at the <strong>{difficulty}</strong> level.
      </p>
      {feedbackEnabled && <p className="summary-feedback">{summaryFeedback(summary.accuracy)}</p>}

      <div className="summary-tiles">
        <StatTiles
          tiles={[
            { label: 'Questions', value: summary.totalAttempts },
            { label: 'Right', value: summary.correctAttempts },
            { label: 'Wrong', value: summary.incorrectAttempts },
            { label: 'Accuracy', value: percent(summary.accuracy) },
            { label: 'To review', value: summary.mistakes.length },
          ]}
        />
      </div>

      {summary.mistakeReview && (
        <section className="summary-review" aria-labelledby="summary-review-heading">
          <h2 id="summary-review-heading" className="setup-group__legend">
            Mistake review
          </h2>
          <StatTiles
            tiles={[
              { label: 'Review questions', value: summary.mistakeReview.questions },
              { label: 'Right', value: summary.mistakeReview.correct },
              { label: 'Mistakes practiced', value: summary.mistakeReview.patternsPracticed },
              { label: 'Mastered', value: summary.mistakeReview.mastered },
            ]}
          />
          {summary.mistakeReview.mastered > 0 && (
            <p className="summary-review__celebrate">
              <span aria-hidden="true">🌟 </span>
              You mastered {summary.mistakeReview.mastered}{' '}
              {summary.mistakeReview.mastered === 1 ? 'mistake' : 'mistakes'}!
            </p>
          )}
        </section>
      )}

      {summary.byOperation.length > 1 && (
        <section className="summary-breakdown" aria-labelledby="by-operation-heading">
          <h2 id="by-operation-heading" className="setup-group__legend">
            By operation
          </h2>
          {/* A table on wider screens; the same results as cards on small screens. */}
          <div className="summary-table-wrap">
            <table className="summary-table" aria-labelledby="by-operation-heading">
              <thead>
                <tr>
                  <th scope="col">Operation</th>
                  <th scope="col">Right</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Avg. time</th>
                </tr>
              </thead>
              <tbody>
                {summary.byOperation.map((stats) => (
                  <tr key={stats.operation}>
                    <th scope="row">{operationLabel(stats.operation)}</th>
                    <td>
                      {stats.correctAttempts} of {stats.totalAttempts}
                    </td>
                    <td>{percent(stats.accuracy)}</td>
                    <td>{seconds(stats.averageTimeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="summary-cards">
            {summary.byOperation.map((stats) => (
              <li key={stats.operation} className="summary-card">
                <h3 className="summary-card__title">{operationLabel(stats.operation)}</h3>
                <dl className="summary-card__stats">
                  <div>
                    <dt>Right</dt>
                    <dd>
                      {stats.correctAttempts} of {stats.totalAttempts}
                    </dd>
                  </div>
                  <div>
                    <dt>Accuracy</dt>
                    <dd>{percent(stats.accuracy)}</dd>
                  </div>
                  <div>
                    <dt>Avg. time</dt>
                    <dd>{seconds(stats.averageTimeMs)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SummaryActions summary={summary} />
    </PageContainer>
  )
}

export default PracticeSummaryPage
