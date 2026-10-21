import { useState } from 'react'
import { useNavigate } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import '../components/practice/practice.css'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import ChoiceCard from '../components/practice/ChoiceCard'
import ClearAllData from '../components/settings/ClearAllData'
import SettingToggle from '../components/settings/SettingToggle'
import { DATA_CLEARED_REASON, ROUTES } from '../data/routes'
import { useMistakePatterns } from '../hooks/useMistakePatterns'
import { useSettings } from '../hooks/useSettings'
import { clearAllAppData } from '../services/storage'
import type { MathOperation } from '../types/question'
import { MASTERY_THRESHOLD_OPTIONS } from '../utils/mistakePatterns'
import './SettingsPage.css'

function SettingsPage() {
  const navigate = useNavigate()
  const { settings, updateSettings, resetSettings } = useSettings()
  const { clearPatterns } = useMistakePatterns()
  // Operations are only saved when at least one is picked, so the shown choice can
  // briefly differ from the saved one.
  const [operations, setOperations] = useState<MathOperation[]>(settings.enabledOperations)
  const [lastChange, setLastChange] = useState(0)

  function save(changes: Parameters<typeof updateSettings>[0]) {
    updateSettings(changes)
    setLastChange((count) => count + 1)
  }

  return (
    <PageContainer title="Settings">
      <div className="settings-page">
        <p className="settings-intro">
          Changes are saved automatically.{' '}
          <span className="settings-saved" role="status">
            {lastChange > 0 ? '✓ Saved' : ''}
          </span>
        </p>

        <section className="settings-section" aria-labelledby="sound-heading">
          <h2 id="sound-heading">Sound and display</h2>
          <div className="settings-list">
            <SettingToggle
              label="Sound effects"
              description="Play sounds while you practice."
              checked={settings.soundEnabled}
              onChange={(soundEnabled) => save({ soundEnabled })}
            />
            <SettingToggle
              label="Card flip animation"
              description="Turn this off if the moving card is distracting. Your device’s “reduce motion” setting also turns it off."
              checked={settings.animationsEnabled}
              onChange={(animationsEnabled) => save({ animationsEnabled })}
            />
            <SettingToggle
              label="Encouraging messages"
              description="Show a friendly message after each answer, like “Great job!” or “Good try!”."
              checked={settings.feedbackEnabled}
              onChange={(feedbackEnabled) => save({ feedbackEnabled })}
            />
            <SettingToggle
              label="Show explanations"
              description="Show how to work out the answer on the back of each card."
              checked={settings.showExplanations}
              onChange={(showExplanations) => save({ showExplanations })}
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="defaults-heading">
          <h2 id="defaults-heading">Practice defaults</h2>
          <p className="settings-section__note">
            New practice sessions start with these choices. You can still change them for a single
            session on the setup page.
          </p>
          <OperationSelector
            legend="Default operations"
            name="default-operations"
            selected={operations}
            onChange={(next) => {
              setOperations(next)
              if (next.length > 0) save({ enabledOperations: next })
            }}
          />
          {operations.length === 0 && (
            <p className="setup-form__message" role="alert">
              Pick at least one operation. Until you do, the last choice is kept.
            </p>
          )}
          <DifficultySelector
            legend="Default difficulty"
            name="default-difficulty"
            value={settings.difficulty}
            onChange={(difficulty) => save({ difficulty })}
          />
          <SessionLengthSelector
            legend="Default session length"
            name="default-session-length"
            value={settings.sessionLength}
            onChange={(sessionLength) => save({ sessionLength })}
          />
        </section>

        <section className="settings-section" aria-labelledby="review-heading">
          <h2 id="review-heading">Mistake review</h2>
          <fieldset className="setup-group">
            <legend className="setup-group__legend">Correct answers to master a mistake</legend>
            <p className="setup-group__hint">
              A mistake is mastered after this many related questions are answered right in a row.
              Mastered mistakes leave mistake review until they’re missed again.
            </p>
            <div className="choice-grid choice-grid--four">
              {MASTERY_THRESHOLD_OPTIONS.map((count) => (
                <ChoiceCard
                  key={count}
                  type="radio"
                  name="mastery-threshold"
                  value={String(count)}
                  checked={settings.masteryThreshold === count}
                  onChange={() => save({ masteryThreshold: count })}
                  label={`${count} in a row`}
                />
              ))}
            </div>
          </fieldset>
        </section>

        <section className="settings-section" aria-labelledby="data-heading">
          <h2 id="data-heading">Your data</h2>
          <p className="settings-section__note">
            To delete only your practice history, use Reset Statistics on the Statistics page.
          </p>
          <ClearAllData
            onClear={() => {
              clearAllAppData()
              resetSettings()
              clearPatterns()
              navigate(ROUTES.home, { state: { reason: DATA_CLEARED_REASON } })
            }}
          />
        </section>
      </div>
    </PageContainer>
  )
}

export default SettingsPage
