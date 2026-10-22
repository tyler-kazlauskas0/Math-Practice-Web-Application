import { memo } from 'react'

interface AnswerChoiceProps {
  value: number
  /** The number key (1–4) that also chooses this answer. */
  shortcut?: number
  isSelected: boolean
  /** True once the card is flipped: the choice can no longer change. */
  isLocked: boolean
  onSelect: (value: number) => void
}

/**
 * One multiple-choice answer, shown as a large button. Its name ("Answer 56") comes from its
 * content, so the visible number is part of it, as voice control needs.
 */
function AnswerChoice({ value, shortcut, isSelected, isLocked, onSelect }: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className={`answer-choice${isSelected ? ' answer-choice--selected' : ''}`}
      aria-pressed={isSelected}
      aria-keyshortcuts={shortcut ? String(shortcut) : undefined}
      disabled={isLocked}
      onClick={() => onSelect(value)}
    >
      {shortcut && (
        <span className="answer-choice__key" aria-hidden="true">
          {shortcut}
        </span>
      )}
      {isSelected && (
        <span className="answer-choice__check" aria-hidden="true">
          ✓
        </span>
      )}
      <span className="visually-hidden">Answer</span> {value}
    </button>
  )
}

// Memoized: choosing an answer re-renders only the buttons whose selection changed.
export default memo(AnswerChoice)
