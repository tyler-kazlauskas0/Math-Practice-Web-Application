import { useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import RecentSessions from '../components/statistics/RecentSessions'
import ResetStatistics from '../components/statistics/ResetStatistics'
import StatCard from '../components/statistics/StatCard'
import '../components/statistics/statistics.css'
import ButtonLink from '../components/ui/ButtonLink'
import StatTiles from '../components/ui/StatTiles'
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../data/practiceOptions'
import { ROUTES } from '../data/routes'
import { RECENT_SESSION_COUNT, useStatistics } from '../hooks/useStatistics'
import { formatPercent } from '../utils/format'

function StatisticsPage() {
  const { statistics, recentSessions, resetStatistics } = useStatistics()
  const [justReset, setJustReset] = useState(false)

  if (statistics.totalAttempts === 0) {
    return (
      <PageContainer title="Statistics">
        <div className="statistics-empty">
          {/* Always rendered so screen readers announce the message after a reset. */}
          <p role="status" className={justReset ? 'statistics-reset-message' : undefined}>
            {justReset ? 'Your practice history was deleted.' : ''}
          </p>
          <p>No practice yet! Answer some questions and your progress will show up here.</p>
          <ButtonLink to={ROUTES.practiceSetup}>Start Practicing</ButtonLink>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Statistics">
      <div className="statistics-page">
        <section className="statistics-section" aria-labelledby="overview-heading">
          <h2 id="overview-heading">Overview</h2>
          <StatTiles
            label="Overall results"
            tiles={[
              { label: 'Questions', value: statistics.totalAttempts },
              { label: 'Right', value: statistics.correctAttempts },
              { label: 'Wrong', value: statistics.incorrectAttempts },
              { label: 'Accuracy', value: formatPercent(statistics.accuracy) },
            ]}
          />
          <p className="statistics-section__note">
            {statistics.totalSessions} {statistics.totalSessions === 1 ? 'session' : 'sessions'} ·
            Best streak: {statistics.bestStreak} right in a row
          </p>
        </section>

        <section className="statistics-section" aria-labelledby="operation-heading">
          <h2 id="operation-heading">By operation</h2>
          <div className="stat-card-grid">
            {OPERATION_OPTIONS.map((option) => (
              <StatCard
                key={option.value}
                title={option.label}
                icon={option.symbol}
                stats={statistics.byOperation[option.value]}
              />
            ))}
          </div>
        </section>

        <section className="statistics-section" aria-labelledby="difficulty-heading">
          <h2 id="difficulty-heading">By level</h2>
          <div className="stat-card-grid">
            {DIFFICULTY_OPTIONS.map((option, index) => (
              <StatCard
                key={option.value}
                title={`Level ${index + 1}: ${option.label}`}
                description={option.description}
                stats={statistics.byDifficulty[option.value]}
              />
            ))}
          </div>
        </section>

        <section className="statistics-section" aria-labelledby="recent-heading">
          <h2 id="recent-heading">Recent sessions</h2>
          <p className="statistics-section__note">
            Your last {RECENT_SESSION_COUNT} sessions, newest first.
          </p>
          <RecentSessions sessions={recentSessions} />
        </section>

        <section className="statistics-section" aria-labelledby="reset-heading">
          <h2 id="reset-heading">Start over</h2>
          <ResetStatistics
            onReset={() => {
              resetStatistics()
              setJustReset(true)
            }}
          />
        </section>
      </div>
    </PageContainer>
  )
}

export default StatisticsPage
