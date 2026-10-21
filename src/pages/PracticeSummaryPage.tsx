import { useLocation } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import '../components/session/session.css'
import ButtonLink from '../components/ui/ButtonLink'
import { OPERATION_OPTIONS } from '../data/practiceOptions'
import { ROUTES } from '../data/routes'
import { isSessionSummary } from '../utils/sessionSummary'

const percent = (fraction: number) => `${Math.round(fraction * 100)}%`
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

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
        <div className="session-actions">
          <ButtonLink to={ROUTES.practiceSetup}>Practice Again</ButtonLink>
          <ButtonLink to={ROUTES.home} variant="secondary">
            Home
          </ButtonLink>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Great Practice!">
      <dl className="summary-totals">
        <div className="summary-totals__item">
          <dt>Questions</dt>
          <dd>{summary.totalAttempts}</dd>
        </div>
        <div className="summary-totals__item">
          <dt>Right</dt>
          <dd>{summary.correctAttempts}</dd>
        </div>
        <div className="summary-totals__item">
          <dt>Wrong</dt>
          <dd>{summary.incorrectAttempts}</dd>
        </div>
        <div className="summary-totals__item">
          <dt>Score</dt>
          <dd>{percent(summary.accuracy)}</dd>
        </div>
      </dl>

      {summary.byOperation.length > 1 && (
        <div className="summary-table-wrap">
          <table className="summary-table">
            <caption className="setup-group__legend">By operation</caption>
            <thead>
              <tr>
                <th scope="col">Operation</th>
                <th scope="col">Right</th>
                <th scope="col">Score</th>
                <th scope="col">Avg. time</th>
              </tr>
            </thead>
            <tbody>
              {summary.byOperation.map((stats) => (
                <tr key={stats.operation}>
                  <th scope="row">
                    {OPERATION_OPTIONS.find((option) => option.value === stats.operation)?.label}
                  </th>
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

      <div className="session-actions">
        <ButtonLink to={ROUTES.practiceSetup}>Practice Again</ButtonLink>
        <ButtonLink to={ROUTES.home} variant="secondary">
          Home
        </ButtonLink>
      </div>
    </PageContainer>
  )
}

export default PracticeSummaryPage
