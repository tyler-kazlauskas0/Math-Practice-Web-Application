import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'

/**
 * The Reset Statistics button and its confirmation. Deleting needs two deliberate steps,
 * ticking "I understand" and then pressing Delete, so it can't happen by accident.
 */
function ResetStatistics({ onReset }: { onReset: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  useEffect(() => {
    if (isConfirming) checkboxRef.current?.focus()
    else if (wasConfirming.current) openButtonRef.current?.focus()
    wasConfirming.current = isConfirming
  }, [isConfirming])

  function close() {
    setIsConfirming(false)
    setUnderstood(false)
  }

  if (!isConfirming) {
    return (
      <Button ref={openButtonRef} variant="danger" onClick={() => setIsConfirming(true)}>
        Reset Statistics
      </Button>
    )
  }

  return (
    <div
      className="reset-confirm"
      role="alertdialog"
      aria-labelledby="reset-title"
      aria-describedby="reset-description"
      onKeyDown={(event) => {
        if (event.key === 'Escape') close()
      }}
    >
      <p id="reset-title" className="reset-confirm__title">
        Delete all practice history?
      </p>
      <p id="reset-description">
        This removes every saved answer and session on this device. Your settings stay the same.
        This can’t be undone.
      </p>
      <label className="reset-confirm__check">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
        />
        I understand my statistics will be deleted
      </label>
      <div className="reset-confirm__buttons">
        <Button variant="danger" disabled={!understood} onClick={onReset}>
          Delete Everything
        </Button>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default ResetStatistics
