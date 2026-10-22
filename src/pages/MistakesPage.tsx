import { useMemo, useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import '../components/statistics/statistics.css'
import Button from '../components/ui/Button'
import ButtonLink from '../components/ui/ButtonLink'
import { ROUTES } from '../data/routes'
import { useMistakePatterns } from '../hooks/useMistakePatterns'
import { useSettings } from '../hooks/useSettings'
import type { MistakePattern } from '../types/mistake'
import { difficultyLabel, formatDateTime, formatPercent } from '../utils/format'
import { describeFact, sortByIncorrectCount } from '../utils/mistakeStatistics'
import { activePatterns, isMastered } from '../utils/mistakePatterns'

type View = 'active' | 'mastered'

const times = (count: number) => `${count} ${count === 1 ? 'time' : 'times'}`

function MistakeCard({ pattern, threshold }: { pattern: MistakePattern; threshold: number }) {
  const progress = Math.min(pattern.similarCorrectCount, threshold)

  return (
    <li className="mistake-card">
      <p className="mistake-card__fact">{describeFact(pattern)}</p>
      <p className="mistake-card__meta">
        {difficultyLabel(pattern.difficulty)} · Missed {times(pattern.incorrectCount)}
      </p>
      {isMastered(pattern) ? (
        <p className="mistake-card__mastered">
          <span aria-hidden="true">✓ </span>Mastered on{' '}
          <time dateTime={pattern.masteredAt!}>{formatDateTime(pattern.masteredAt!)}</time>
        </p>
      ) : (
        <>
          <p className="mistake-card__progress">
            Progress: {progress} of {threshold} right in a row
          </p>
          <div className="stat-card__meter" aria-hidden="true">
            <div
              className="stat-card__meter-fill"
              style={{ width: formatPercent(progress / threshold) }}
            />
          </div>
        </>
      )}
      <p className="mistake-card__date">
        Last missed:{' '}
        <time dateTime={pattern.lastIncorrectAt}>{formatDateTime(pattern.lastIncorrectAt)}</time>
      </p>
    </li>
  )
}

function MistakesPage() {
  const { patterns } = useMistakePatterns()
  const { masteryThreshold } = useSettings().settings
  const [view, setView] = useState<View>('active')

  // Sorted once per change to the mistakes (up to 500), not again when switching views.
  const { active, mastered } = useMemo(
    () => ({
      active: sortByIncorrectCount(activePatterns(patterns)),
      mastered: sortByIncorrectCount(patterns.filter(isMastered)),
    }),
    [patterns],
  )
  const shown = view === 'active' ? active : mastered

  return (
    <PageContainer title="Mistakes">
      <div className="statistics-page">
        <div className="mistake-views" role="group" aria-label="Show">
          <Button
            variant="secondary"
            aria-pressed={view === 'active'}
            onClick={() => setView('active')}
          >
            {view === 'active' && <span aria-hidden="true">✓ </span>}
            Needs Practice ({active.length})
          </Button>
          <Button
            variant="secondary"
            aria-pressed={view === 'mastered'}
            onClick={() => setView('mastered')}
          >
            {view === 'mastered' && <span aria-hidden="true">✓ </span>}
            Mastered ({mastered.length})
          </Button>
        </div>

        {shown.length === 0 ? (
          <p className="statistics-empty-note">
            {view === 'active'
              ? 'Nothing needs practice right now. Great work!'
              : `No mastered mistakes yet. Answer ${masteryThreshold} related questions right in a row to master one.`}
          </p>
        ) : (
          <ul
            className="mistake-list"
            aria-label={view === 'active' ? 'Needs practice' : 'Mastered'}
          >
            {shown.map((pattern) => (
              <MistakeCard key={pattern.key} pattern={pattern} threshold={masteryThreshold} />
            ))}
          </ul>
        )}

        <ButtonLink to={ROUTES.statistics} variant="secondary" className="most-missed__link">
          Back to Statistics
        </ButtonLink>
      </div>
    </PageContainer>
  )
}

export default MistakesPage
