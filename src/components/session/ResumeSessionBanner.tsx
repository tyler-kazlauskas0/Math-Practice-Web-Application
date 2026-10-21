import { useState } from 'react'
import { ROUTES } from '../../data/routes'
import { loadActiveSession } from '../../services/activeSession'
import { getTotalQuestions } from '../../utils/practiceSession'
import ButtonLink from '../ui/ButtonLink'

/** Offers to continue a practice session left unfinished (e.g. the tab was closed). */
function ResumeSessionBanner() {
  const [saved] = useState(loadActiveSession)
  if (!saved) return null

  const { session } = saved
  const total = getTotalQuestions(session)
  const position = `Question ${session.currentQuestionIndex + 1}${total === null ? '' : ` of ${total}`}`

  return (
    <div className="resume-banner" role="region" aria-labelledby="resume-banner-title">
      <p id="resume-banner-title" className="resume-banner__title">
        You have a practice session in progress
      </p>
      <p className="resume-banner__detail">
        {position} · {session.attempts.length} answered
      </p>
      {/* No navigation state: the session page resumes the saved session. */}
      <ButtonLink to={ROUTES.practiceSession}>Resume Session</ButtonLink>
    </div>
  )
}

export default ResumeSessionBanner
