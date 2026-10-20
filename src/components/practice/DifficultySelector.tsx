import { DIFFICULTY_OPTIONS } from '../../data/practiceOptions'
import type { DifficultyLevel } from '../../types/question'
import ChoiceCard from './ChoiceCard'

interface DifficultySelectorProps {
  value: DifficultyLevel
  onChange: (difficulty: DifficultyLevel) => void
}

/** Lets the player pick exactly one difficulty level. */
function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">How hard?</legend>
      <div className="choice-grid choice-grid--two">
        {DIFFICULTY_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            type="radio"
            name="difficulty"
            value={option.value}
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

export default DifficultySelector
