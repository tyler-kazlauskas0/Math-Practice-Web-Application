interface AnswerChoiceProps {
  value: number
  isSelected: boolean
  /** True once the card is flipped: the choice can no longer change. */
  isLocked: boolean
  onSelect: (value: number) => void
}

/** One multiple-choice answer, shown as a large button. */
function AnswerChoice({ value, isSelected, isLocked, onSelect }: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className={`answer-choice${isSelected ? ' answer-choice--selected' : ''}`}
      aria-label={`Answer ${value}`}
      aria-pressed={isSelected}
      disabled={isLocked}
      onClick={() => onSelect(value)}
    >
      {isSelected && (
        <span className="answer-choice__check" aria-hidden="true">
          ✓
        </span>
      )}
      {value}
    </button>
  )
}

export default AnswerChoice
