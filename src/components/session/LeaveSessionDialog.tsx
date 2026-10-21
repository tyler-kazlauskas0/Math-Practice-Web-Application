import { useEffect, useRef } from 'react'
import Button from '../ui/Button'

interface LeaveSessionDialogProps {
  answered: number
  /** Stay on the session. */
  onStay: () => void
  /** End the session (it's saved to statistics) and go where the player was heading. */
  onLeave: () => void
}

/** Shown when the player tries to leave a practice session that's in progress. */
function LeaveSessionDialog({ answered, onStay, onLeave }: LeaveSessionDialogProps) {
  const stayRef = useRef<HTMLButtonElement>(null)

  // The safe choice gets focus, so a stray Enter keeps the session going.
  useEffect(() => {
    stayRef.current?.focus()
    stayRef.current?.scrollIntoView?.({ block: 'center' })
  }, [])

  return (
    <div
      className="end-session-confirm leave-session"
      role="alertdialog"
      aria-labelledby="leave-session-title"
      aria-describedby="leave-session-description"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onStay()
      }}
    >
      <p id="leave-session-title" className="end-session-confirm__title">
        Leave this practice session?
      </p>
      <p id="leave-session-description">
        You’ve answered {answered} {answered === 1 ? 'question' : 'questions'}. If you leave now,
        the session ends and your answers are saved to your statistics.
      </p>
      <div className="end-session-confirm__buttons">
        <Button ref={stayRef} onClick={onStay}>
          Keep Practicing
        </Button>
        <Button variant="danger" onClick={onLeave}>
          End Session and Leave
        </Button>
      </div>
    </div>
  )
}

export default LeaveSessionDialog
