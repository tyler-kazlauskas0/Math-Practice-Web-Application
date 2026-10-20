import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import type { MathOperation } from '../../types/question'
import Button from '../ui/Button'
import ChoiceCard from './ChoiceCard'

interface OperationSelectorProps {
  selected: MathOperation[]
  onChange: (operations: MathOperation[]) => void
}

/** Lets the player pick one or more operations to practice. */
function OperationSelector({ selected, onChange }: OperationSelectorProps) {
  const allSelected = selected.length === OPERATION_OPTIONS.length

  function toggle(operation: MathOperation) {
    const next = selected.includes(operation)
      ? selected.filter((op) => op !== operation)
      : [...selected, operation]
    // Keep the order the options are shown in, regardless of click order.
    onChange(OPERATION_OPTIONS.map((option) => option.value).filter((op) => next.includes(op)))
  }

  function toggleAll() {
    onChange(allSelected ? [] : OPERATION_OPTIONS.map((option) => option.value))
  }

  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">What do you want to practice?</legend>
      <p className="setup-group__hint">Pick one or more.</p>
      <div className="choice-grid choice-grid--four">
        {OPERATION_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            type="checkbox"
            name="operations"
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
            label={option.label}
            icon={option.symbol}
          />
        ))}
      </div>
      <Button variant="secondary" className="setup-group__shortcut" onClick={toggleAll}>
        {allSelected ? 'Clear all' : 'Select all'}
      </Button>
    </fieldset>
  )
}

export default OperationSelector
