import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'

interface EndSessionControlProps {
  answered: number
  onEnd: () => void
}

/**
 * The End Session button. Once at least one question is answered it asks for confirmation
 * first, so a stray tap doesn't end the session. With nothing answered it ends right away.
 */
function EndSessionControl({ answered, onEnd }: EndSessionControlProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const endButtonRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  // Move focus into the question when it appears, and back to the button when it closes.
  useEffect(() => {
    if (isConfirming) confirmRef.current?.focus()
    else if (wasConfirming.current) endButtonRef.current?.focus()
    wasConfirming.current = isConfirming
  }, [isConfirming])

  if (!isConfirming) {
    return (
      <Button
        ref={endButtonRef}
        variant="secondary"
        onClick={() => (answered === 0 ? onEnd() : setIsConfirming(true))}
      >
        End Session
      </Button>
    )
  }

  return (
    <div
      className="end-session-confirm"
      role="alertdialog"
      aria-labelledby="end-session-title"
      aria-describedby="end-session-description"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setIsConfirming(false)
      }}
    >
      <p id="end-session-title" className="end-session-confirm__title">
        End this session?
      </p>
      <p id="end-session-description">
        You’ve answered {answered} {answered === 1 ? 'question' : 'questions'}. You’ll see how you
        did.
      </p>
      <div className="end-session-confirm__buttons">
        <Button ref={confirmRef} variant="danger" onClick={onEnd}>
          Yes, End Session
        </Button>
        <Button variant="secondary" onClick={() => setIsConfirming(false)}>
          Keep Practicing
        </Button>
      </div>
    </div>
  )
}

export default EndSessionControl
