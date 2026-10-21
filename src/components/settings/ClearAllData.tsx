import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'

/** The word the player must type to confirm. */
export const CONFIRM_WORD = 'DELETE'

/**
 * The Clear All Application Data button and its confirmation. Because this removes
 * everything, the player must type DELETE before the final button works.
 */
function ClearAllData({ onClear }: { onClear: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD

  useEffect(() => {
    if (isConfirming) inputRef.current?.focus()
    else if (wasConfirming.current) openButtonRef.current?.focus()
    wasConfirming.current = isConfirming
  }, [isConfirming])

  function close() {
    setIsConfirming(false)
    setTyped('')
  }

  if (!isConfirming) {
    return (
      <Button ref={openButtonRef} variant="danger" onClick={() => setIsConfirming(true)}>
        Clear All Application Data
      </Button>
    )
  }

  return (
    <div
      className="clear-data-confirm"
      role="alertdialog"
      aria-labelledby="clear-data-title"
      aria-describedby="clear-data-warning"
      onKeyDown={(event) => {
        if (event.key === 'Escape') close()
      }}
    >
      <form
        className="clear-data-confirm__form"
        onSubmit={(event) => {
          event.preventDefault()
          if (confirmed) onClear()
        }}
      >
        <p id="clear-data-title" className="clear-data-confirm__title">
          <span aria-hidden="true">⚠️ </span>Delete everything?
        </p>
        <div id="clear-data-warning">
          <p>This permanently deletes all of this app’s data on this device:</p>
          <ul>
            <li>every practice session and answer</li>
            <li>all statistics and mistakes to review</li>
            <li>all of your settings</li>
          </ul>
          <p>
            <strong>This can’t be undone.</strong>
          </p>
        </div>
        <label className="clear-data-confirm__label" htmlFor="clear-data-input">
          Type <strong>{CONFIRM_WORD}</strong> to confirm
        </label>
        <input
          ref={inputRef}
          id="clear-data-input"
          className="clear-data-confirm__input"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="clear-data-confirm__buttons">
          <Button type="submit" variant="danger" disabled={!confirmed}>
            Delete Everything
          </Button>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ClearAllData
