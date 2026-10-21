import { DIFFICULTY_OPTIONS } from '../../data/practiceOptions'
import type { DifficultyLevel } from '../../types/question'
import ChoiceCard from './ChoiceCard'

interface DifficultySelectorProps {
  value: DifficultyLevel
  onChange: (difficulty: DifficultyLevel) => void
  legend?: string
  name?: string
}

/** Lets the player pick exactly one difficulty level. */
function DifficultySelector({
  value,
  onChange,
  legend = 'How hard?',
  name = 'difficulty',
}: DifficultySelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">{legend}</legend>
      <div className="choice-grid choice-grid--two">
        {DIFFICULTY_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            type="radio"
            name={name}
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
