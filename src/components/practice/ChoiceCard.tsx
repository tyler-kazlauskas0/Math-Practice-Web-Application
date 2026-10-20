import type { ReactNode } from 'react'

interface ChoiceCardProps {
  /** `checkbox` lets several cards in a group be chosen; `radio` allows only one. */
  type: 'checkbox' | 'radio'
  name: string
  value: string
  checked: boolean
  onChange: () => void
  label: string
  description?: string
  /** A large symbol shown above the label, e.g. `+`. */
  icon?: ReactNode
}

/**
 * A large, tappable card wrapping a native checkbox or radio button. The native input
 * keeps it keyboard accessible: Tab to reach it, Space to toggle, arrow keys within radio groups.
 */
function ChoiceCard({
  type,
  name,
  value,
  checked,
  onChange,
  label,
  description,
  icon,
}: ChoiceCardProps) {
  const labelId = `${name}-${value}-label`
  const descriptionId = description ? `${name}-${value}-description` : undefined

  return (
    <label className={`choice-card${checked ? ' choice-card--selected' : ''}`}>
      <input
        className="choice-card__input"
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        // Name the input by its label only, so the description isn't read as part of it.
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      />
      <span className="choice-card__check" aria-hidden="true">
        ✓
      </span>
      {icon && (
        <span className="choice-card__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span id={labelId} className="choice-card__label">
        {label}
      </span>
      {description && (
        <span id={descriptionId} className="choice-card__description">
          {description}
        </span>
      )}
    </label>
  )
}

export default ChoiceCard
