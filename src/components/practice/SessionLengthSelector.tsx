import { SESSION_LENGTH_OPTIONS } from '../../data/practiceOptions'
import type { SessionLength } from '../../types/session'
import ChoiceCard from './ChoiceCard'

interface SessionLengthSelectorProps {
  value: SessionLength
  onChange: (sessionLength: SessionLength) => void
}

/** Lets the player pick how many questions to answer. */
function SessionLengthSelector({ value, onChange }: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">How many questions?</legend>
      <div className="choice-grid choice-grid--four">
        {SESSION_LENGTH_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            type="radio"
            name="sessionLength"
            value={String(option.value)}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
            description={option.description}
          />
        ))}
      </div>
    </fieldset>
  )
}

export default SessionLengthSelector
