import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import PracticeModeSelector from '../components/practice/PracticeModeSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import '../components/practice/practice.css'
import ResumeSessionBanner from '../components/session/ResumeSessionBanner'
import '../components/session/session.css'
import Button from '../components/ui/Button'
import { MISSING_SESSION_REASON, ROUTES } from '../data/routes'
import { useMistakePatterns } from '../hooks/useMistakePatterns'
import { useSettings } from '../hooks/useSettings'
import type { MistakePattern } from '../types/mistake'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeConfig, PracticeMode, PracticeSessionRequest } from '../types/session'
import { activePatterns } from '../utils/mistakePatterns'
import { isPracticeConfig } from '../utils/practiceConfig'

/**
 * The setup choices recorded for a mistake review: the operations being reviewed and the
 * most common difficulty among them (each question still uses its own mistake's level).
 */
function reviewConfig(patterns: MistakePattern[], sessionLength: PracticeConfig['sessionLength']) {
  const operations = [...new Set(patterns.map((pattern) => pattern.operation))] as MathOperation[]
  const counts = new Map<DifficultyLevel, number>()
  patterns.forEach((p) => counts.set(p.difficulty, (counts.get(p.difficulty) ?? 0) + 1))
  const difficulty = [...counts].sort((a, b) => b[1] - a[1])[0][0]
  return { operations, difficulty, sessionLength }
}

function PracticeSetupPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const active = activePatterns(useMistakePatterns().patterns)
  const [mode, setMode] = useState<PracticeMode>('practice')
  const isMistakeReview = mode === 'mistake-review' && active.length > 0
  const { state } = useLocation()
  const navigationState = state as { reason?: unknown; config?: unknown } | null
  const cameFromMissingSession = navigationState?.reason === MISSING_SESSION_REASON
  // Start from the previous session's choices when coming from the summary's Change Settings,
  // otherwise from the defaults chosen in Settings. Changes here apply to this session only.
  const [config, setConfig] = useState<PracticeConfig>(() =>
    isPracticeConfig(navigationState?.config)
      ? navigationState.config
      : {
          operations: settings.enabledOperations,
          difficulty: settings.difficulty,
          sessionLength: settings.sessionLength,
        },
  )
  const hasOperations = isMistakeReview || config.operations.length > 0

  return (
    <PageContainer title="Practice Setup">
      <ResumeSessionBanner />
      {cameFromMissingSession && (
        <p className="setup-notice" role="status">
          There’s no practice session to continue. It may have already finished, or the page was
          opened from an old link. Choose what you want to practice to start a new one.
        </p>
      )}
      <form
        className="setup-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!hasOperations) return
          const request: PracticeSessionRequest = isMistakeReview
            ? { ...reviewConfig(active, config.sessionLength), mode: 'mistake-review' }
            : config
          navigate(ROUTES.practiceSession, { state: request })
        }}
      >
        <PracticeModeSelector
          value={isMistakeReview ? 'mistake-review' : 'practice'}
          onChange={setMode}
          activeMistakeCount={active.length}
        />
        {isMistakeReview ? (
          <p className="setup-review-note">
            You’ll get questions like the ones you missed, at the level you missed them. Answer{' '}
            {settings.masteryThreshold} related questions right in a row and that mistake is
            mastered!
          </p>
        ) : (
          <>
            <OperationSelector
              selected={config.operations}
              onChange={(operations) => setConfig({ ...config, operations })}
            />
            <DifficultySelector
              value={config.difficulty}
              onChange={(difficulty) => setConfig({ ...config, difficulty })}
            />
          </>
        )}
        <SessionLengthSelector
          value={config.sessionLength}
          onChange={(sessionLength) => setConfig({ ...config, sessionLength })}
        />
        <div className="setup-form__actions">
          {/* Always rendered so screen readers announce the message when it appears. */}
          <p id="setup-validation" className="setup-form__message" role="status">
            {hasOperations ? '' : 'Pick at least one operation to start.'}
          </p>
          <Button
            type="submit"
            className="setup-form__start"
            disabled={!hasOperations}
            aria-describedby="setup-validation"
          >
            Start Session
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}

export default PracticeSetupPage
