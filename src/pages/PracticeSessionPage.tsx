import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import QuestionCard from '../components/question/QuestionCard'
import EndSessionControl from '../components/session/EndSessionControl'
import SessionProgress from '../components/session/SessionProgress'
import '../components/session/session.css'
import ButtonLink from '../components/ui/ButtonLink'
import { MISSING_SESSION_REASON, ROUTES } from '../data/routes'
import { usePracticeSession } from '../hooks/usePracticeSession'
import { useMistakePatterns } from '../hooks/useMistakePatterns'
import { useSettings } from '../hooks/useSettings'
import type { Question } from '../types/question'
import type { PracticeConfig, PracticeSessionRequest } from '../types/session'
import { isPracticeConfig } from '../utils/practiceConfig'
import { activePatterns } from '../utils/mistakePatterns'
import {
  getTotalQuestions,
  isOnLastQuestion,
  isReviewSession,
  validReviewQuestions,
} from '../utils/practiceSession'
import { createSessionSummary } from '../utils/sessionSummary'

function PracticeSessionPage() {
  const { state } = useLocation()
  const { patterns } = useMistakePatterns()
  // Checked once, when the page opens: mastering the last mistake mid-session must not
  // send the player away before they see their summary.
  const [hadActiveMistakes] = useState(() => activePatterns(patterns).length > 0)

  // The setup page passes the configuration as navigation state. Without it (e.g. the page
  // was opened from a bookmark) there is no session, so go back to setup.
  const backToSetup = (
    <Navigate to={ROUTES.practiceSetup} replace state={{ reason: MISSING_SESSION_REASON }} />
  )
  if (!isPracticeConfig(state)) return backToSetup

  const { operations, difficulty, sessionLength, reviewQuestions, mode } =
    state as PracticeSessionRequest
  // Re-asking exact questions needs at least one valid question to ask.
  const review = reviewQuestions === undefined ? null : validReviewQuestions(reviewQuestions)
  if (review !== null && review.length === 0) return backToSetup
  // A mistake review needs at least one mistake that isn't mastered yet.
  const mistakeReview = mode === 'mistake-review'
  if (mistakeReview && !hadActiveMistakes) return backToSetup

  return (
    <PracticeSession
      config={{ operations, difficulty, sessionLength }}
      reviewQuestions={review}
      mistakeReview={mistakeReview}
    />
  )
}

interface PracticeSessionProps {
  config: PracticeConfig
  reviewQuestions: Question[] | null
  mistakeReview: boolean
}

/** Runs a practice session: question cards one at a time, then the summary page. */
function PracticeSession({ config, reviewQuestions, mistakeReview }: PracticeSessionProps) {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { patterns } = useMistakePatterns()
  const { state, recordResult, nextQuestion, endSession } = usePracticeSession(config, {
    reviewQuestions,
    mistakeReview,
  })
  const totalQuestions = getTotalQuestions(state)
  const isReview = isReviewSession(state)
  const title = isReview ? 'Mistake Review' : 'Practice'
  const answered = state.attempts.length
  const ended = !state.isActive && state.currentRound !== null

  useEffect(() => {
    if (!ended) return
    // Mistakes this session's review questions came from that are now mastered.
    const practiced = new Set(state.attempts.map((attempt) => attempt.question.mistakePatternId))
    const masteredCount = patterns.filter(
      (pattern) =>
        practiced.has(pattern.key) &&
        pattern.masteredAt !== null &&
        pattern.masteredAt >= state.startedAt,
    ).length
    // Replace the history entry so Back doesn't return to a finished session.
    navigate(ROUTES.practiceSummary, {
      replace: true,
      state: createSessionSummary(state, { isReview, masteredCount }),
    })
  }, [ended, isReview, navigate, patterns, state])

  if (state.currentRound === null) {
    return (
      <PageContainer title={title}>
        <p role="alert">Something went wrong while making a question. Please try again.</p>
        <ButtonLink to={ROUTES.practiceSetup}>Back to Setup</ButtonLink>
      </PageContainer>
    )
  }

  if (ended) return null

  const questionNumber = state.currentQuestionIndex + 1

  return (
    <PageContainer title={title}>
      <div className="practice-session">
        <SessionProgress answered={answered} total={totalQuestions} correct={state.correctCount} />
        <QuestionCard
          // A new key per question gives a fresh card: nothing selected, not flipped.
          key={state.currentRound.question.id}
          question={state.currentRound.question}
          choices={state.currentRound.choices}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          isLastQuestion={isOnLastQuestion(state)}
          animate={settings.animationsEnabled}
          autoFocus={questionNumber > 1}
          enterTransition={questionNumber > 1}
          onResult={recordResult}
          onNext={nextQuestion}
        />
        <div className="session-actions">
          <EndSessionControl answered={answered} onEnd={endSession} />
        </div>
      </div>
    </PageContainer>
  )
}

export default PracticeSessionPage
