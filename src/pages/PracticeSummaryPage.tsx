import { useLocation } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import '../components/session/session.css'
import Button from '../components/ui/Button'
import ButtonLink from '../components/ui/ButtonLink'
import StatTiles from '../components/ui/StatTiles'
import { ROUTES } from '../data/routes'
import type { PracticeSessionRequest } from '../types/session'
import type { SessionSummary } from '../types/statistics'
import {
  difficultyLabel,
  formatPercent as percent,
  listNames,
  operationLabel,
} from '../utils/format'
import { isSessionSummary } from '../utils/sessionSummary'

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

function SummaryActions({ summary }: { summary: SessionSummary }) {
  const mistakeCount = summary.mistakes.length
  const reviewRequest: PracticeSessionRequest = {
    ...summary.config,
    reviewQuestions: summary.mistakes,
  }

  return (
    <div className="summary-actions">
      <ButtonLink to={ROUTES.practiceSession} state={summary.config}>
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

      {summary.byOperation.length > 1 && (
        <div className="summary-table-wrap">
          <table className="summary-table">
            <caption className="setup-group__legend">By operation</caption>
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
      )}

      <SummaryActions summary={summary} />
    </PageContainer>
  )
}

export default PracticeSummaryPage
