import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import '../components/practice/practice.css'
import Button from '../components/ui/Button'
import { MISSING_SESSION_REASON, ROUTES } from '../data/routes'
import { useSettings } from '../hooks/useSettings'
import type { PracticeConfig } from '../types/session'
import { isPracticeConfig } from '../utils/practiceConfig'

function PracticeSetupPage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { state } = useLocation()
  const navigationState = state as { reason?: unknown; config?: unknown } | null
  const cameFromMissingSession = navigationState?.reason === MISSING_SESSION_REASON
  // Start from the previous session's choices when coming from the summary's Change Settings,
  // otherwise from the choices saved last time.
  const [config, setConfig] = useState<PracticeConfig>(() =>
    isPracticeConfig(navigationState?.config)
      ? navigationState.config
      : {
          operations: settings.enabledOperations,
          difficulty: settings.difficulty,
          sessionLength: settings.sessionLength,
        },
  )
  const hasOperations = config.operations.length > 0

  return (
    <PageContainer title="Practice Setup">
      {cameFromMissingSession && (
        <p className="setup-notice" role="status">
          Choose what you want to practice, then press Start Session.
        </p>
      )}
      <form
        className="setup-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!hasOperations) return
          // Remember these choices for next time.
          updateSettings({
            enabledOperations: config.operations,
            difficulty: config.difficulty,
            sessionLength: config.sessionLength,
          })
          navigate(ROUTES.practiceSession, { state: config })
        }}
      >
        <OperationSelector
          selected={config.operations}
          onChange={(operations) => setConfig({ ...config, operations })}
        />
        <DifficultySelector
          value={config.difficulty}
          onChange={(difficulty) => setConfig({ ...config, difficulty })}
        />
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
