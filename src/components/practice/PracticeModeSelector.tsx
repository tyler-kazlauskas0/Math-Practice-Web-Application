import type { PracticeMode } from '../../types/session'
import ChoiceCard from './ChoiceCard'

interface PracticeModeSelectorProps {
  value: PracticeMode
  onChange: (mode: PracticeMode) => void
  /** Saved mistakes that still need review. Mistake review is disabled when this is 0. */
  activeMistakeCount: number
}

/** Choose between regular practice and reviewing saved mistakes. */
function PracticeModeSelector({ value, onChange, activeMistakeCount }: PracticeModeSelectorProps) {
  const reviewDescription =
    activeMistakeCount === 0
      ? 'Not available yet: there are no mistakes to review. Answers you mark wrong will show up here.'
      : `${activeMistakeCount} ${activeMistakeCount === 1 ? 'mistake' : 'mistakes'} to review`

  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">What kind of practice?</legend>
      <div className="choice-grid choice-grid--two">
        <ChoiceCard
          type="radio"
          name="mode"
          value="practice"
          checked={value === 'practice'}
          onChange={() => onChange('practice')}
          label="Regular practice"
          description="New questions from the operations you pick"
        />
        <ChoiceCard
          type="radio"
          name="mode"
          value="mistake-review"
          checked={value === 'mistake-review'}
          onChange={() => onChange('mistake-review')}
          label="Mistake review"
          description={reviewDescription}
          disabled={activeMistakeCount === 0}
        />
      </div>
    </fieldset>
  )
}

export default PracticeModeSelector
