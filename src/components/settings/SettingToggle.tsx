import { useId } from 'react'

interface SettingToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** A large on/off setting with a label and a short explanation. */
function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  const id = useId()

  return (
    <label className="setting-toggle">
      <input
        type="checkbox"
        className="setting-toggle__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
      />
      <span className="setting-toggle__text">
        <span id={`${id}-label`} className="setting-toggle__label">
          {label}
        </span>
        <span id={`${id}-description`} className="setting-toggle__description">
          {description}
        </span>
      </span>
    </label>
  )
}

export default SettingToggle
