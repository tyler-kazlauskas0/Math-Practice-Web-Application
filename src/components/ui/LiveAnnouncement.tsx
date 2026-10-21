/**
 * Text read out by screen readers when it changes, without being shown on screen.
 * Keep it always rendered (even when empty) so the change is noticed.
 */
function LiveAnnouncement({ message }: { message: string }) {
  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {message}
    </p>
  )
}

export default LiveAnnouncement
