import { ROUTES } from '../../data/routes'
import type { MistakePattern } from '../../types/mistake'
import type { MathOperation } from '../../types/question'
import { listNames, operationLabel } from '../../utils/format'
import { describeFact, mostMissedFacts, type MistakeSummary } from '../../utils/mistakeStatistics'
import { isMastered } from '../../utils/mistakePatterns'
import ButtonLink from '../ui/ButtonLink'
import StatTiles from '../ui/StatTiles'

interface MistakeOverviewProps {
  summary: MistakeSummary
  patterns: MistakePattern[]
  /** Operations answered wrong most often; several when tied. */
  mostMissedOperations: MathOperation[]
}

const times = (count: number) => `${count} ${count === 1 ? 'time' : 'times'}`

/** Mistake totals and the most-missed operation and facts, for the Statistics page. */
function MistakeOverview({ summary, patterns, mostMissedOperations }: MistakeOverviewProps) {
  if (patterns.length === 0) {
    return (
      <p className="statistics-empty-note">
        No mistakes so far. Great work! Answers you mark wrong will show up here.
      </p>
    )
  }

  return (
    <>
      <StatTiles
        label="Mistake totals"
        tiles={[
          { label: 'Need practice', value: summary.activeCount },
          { label: 'Mastered', value: summary.masteredCount },
          { label: 'Review questions', value: summary.reviewQuestions },
          { label: 'Review right', value: summary.reviewCorrect },
        ]}
      />

      {mostMissedOperations.length > 0 && (
        <p className="most-missed__operation">
          Most missed operation:{' '}
          <strong>{listNames(mostMissedOperations.map(operationLabel))}</strong>
          {mostMissedOperations.length > 1 && ' (tied)'}
        </p>
      )}

      <h3 className="most-missed__heading">Most missed facts</h3>
      <ol className="most-missed__list">
        {mostMissedFacts(patterns).map((pattern) => (
          <li key={pattern.key} className="most-missed__item">
            <span className="most-missed__fact">{describeFact(pattern)}</span>
            <span className="most-missed__count">
              missed {times(pattern.incorrectCount)}
              {isMastered(pattern) && (
                <span className="tag tag--success">
                  <span aria-hidden="true">✓ </span>Mastered
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      <ButtonLink to={ROUTES.mistakes} variant="secondary" className="most-missed__link">
        See All Mistakes
      </ButtonLink>
    </>
  )
}

export default MistakeOverview
