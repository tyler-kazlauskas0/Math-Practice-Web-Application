import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useBlocker, useLocation, useNavigate } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import QuestionCard, { type QuestionCardState } from '../components/question/QuestionCard'
import EndSessionControl from '../components/session/EndSessionControl'
import LeaveSessionDialog from '../components/session/LeaveSessionDialog'
import SessionProgress from '../components/session/SessionProgress'
import '../components/session/session.css'
import ButtonLink from '../components/ui/ButtonLink'
import ErrorMessage from '../components/ui/ErrorMessage'
import LiveAnnouncement from '../components/ui/LiveAnnouncement'
import { MISSING_SESSION_REASON, ROUTES } from '../data/routes'
import { usePracticeSession } from '../hooks/usePracticeSession'
import { useMistakePatterns } from '../hooks/useMistakePatterns'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useSettings } from '../hooks/useSettings'
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
  type SavedActiveSession,
} from '../services/activeSession'
import type { Question } from '../types/question'
import type { PracticeConfig, PracticeSessionRequest } from '../types/session'
import { isPracticeConfig } from '../utils/practiceConfig'
import { pickFeedback } from '../utils/feedback'
import { activePatterns } from '../utils/mistakePatterns'
import {
  getTotalQuestions,
  hasRecordedCurrent,
  isOnLastQuestion,
  isReviewSession,
  validReviewQuestions,
} from '../utils/practiceSession'
import { createSessionSummary } from '../utils/sessionSummary'

function PracticeSessionPage() {
  const { state, key: locationKey } = useLocation()
  const { patterns } = useMistakePatterns()
  // A saved session in progress is resumed after a refresh (same history entry), or when this
  // page is opened without a new session to start (e.g. from a Resume button or a bookmark).
  const [resumed] = useState(() => {
    const saved = loadActiveSession()
    if (!saved) return null
    return saved.locationKey === locationKey || !isPracticeConfig(state) ? saved : null
  })
  // Checked once, when the page opens: mastering the last mistake mid-session must not
  // send the player away before they see their summary.
  const [hadActiveMistakes] = useState(() => activePatterns(patterns).length > 0)

  // The setup page passes the configuration as navigation state. Without it (e.g. the page
  // was opened from a bookmark) there is no session, so go back to setup.
  const backToSetup = (
    <Navigate to={ROUTES.practiceSetup} replace state={{ reason: MISSING_SESSION_REASON }} />
  )
  if (resumed) {
    return (
      <PracticeSession
        config={resumed.session.config}
        reviewQuestions={null}
        mistakeReview={false}
        resumed={resumed}
      />
    )
  }
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
  /** A saved session to continue instead of starting a new one. */
  resumed?: SavedActiveSession | null
}

/** Runs a practice session: question cards one at a time, then the summary page. */
function PracticeSession({
  config,
  reviewQuestions,
  mistakeReview,
  resumed = null,
}: PracticeSessionProps) {
  const navigate = useNavigate()
  const { key: locationKey } = useLocation()
  const { settings } = useSettings()
  const { patterns } = useMistakePatterns()
  // Animate only if both the app setting and the device allow it.
  const prefersReducedMotion = usePrefersReducedMotion()
  // Remember the last message so the next one is different.
  const lastFeedback = useRef<string | null>(null)
  const { feedbackEnabled } = settings
  const getFeedback = useCallback(
    (markedCorrect: boolean) => {
      if (!feedbackEnabled) return null
      lastFeedback.current = pickFeedback(markedCorrect, lastFeedback.current)
      return lastFeedback.current
    },
    [feedbackEnabled],
  )
  const animate = settings.animationsEnabled && !prefersReducedMotion
  const { state, recordResult, nextQuestion, endSession } = usePracticeSession(config, {
    reviewQuestions,
    mistakeReview,
    restored: resumed?.session,
  })

  // ---- Saving the session in progress, so a refresh or closed tab doesn't lose it ----
  const cardState = useRef(resumed?.card ?? null)
  const stateRef = useRef(state)
  const save = useCallback(() => {
    saveActiveSession({ locationKey, session: stateRef.current, card: cardState.current })
  }, [locationKey])
  useEffect(() => {
    stateRef.current = state
    save()
  }, [state, save])
  const questionId = state.currentRound?.question.id
  const handleCardChange = useCallback(
    (card: QuestionCardState) => {
      if (!questionId) return
      cardState.current = { questionId, ...card }
      save()
    },
    [questionId, save],
  )

  // ---- Asking before leaving a session in progress ----
  const [isLeaving, setIsLeaving] = useState(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const leaving = state.isActive && currentLocation.pathname !== nextLocation.pathname
    if (!leaving) return false
    // Leaving before answering anything: nothing to lose or resume, so just go.
    if (state.attempts.length === 0) {
      clearActiveSession()
      return false
    }
    return true
  })
  const totalQuestions = getTotalQuestions(state)
  const isReview = isReviewSession(state)
  const title = isReview ? 'Mistake Review' : 'Practice'
  const answered = state.attempts.length
  const ended = !state.isActive && state.currentRound !== null

  useEffect(() => {
    if (!ended) return
    clearActiveSession()
    // Ending in order to leave: go where the player was heading, not to the summary.
    if (isLeaving) {
      if (blocker.state === 'blocked') blocker.proceed()
      return
    }
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
  }, [blocker, ended, isLeaving, isReview, navigate, patterns, state])

  if (state.currentRound === null) {
    return (
      <PageContainer title={title}>
        <ErrorMessage
          title="We couldn’t make a question"
          actions={<ButtonLink to={ROUTES.practiceSetup}>Back to Setup</ButtonLink>}
        >
          <p>Something went wrong while making the next question. It’s not your fault!</p>
          <p>Your answers so far are saved. Try setting up practice again.</p>
        </ErrorMessage>
      </PageContainer>
    )
  }

  if (ended) return null

  const questionNumber = state.currentQuestionIndex + 1
  // A restored card reopens as it was: answer chosen, flipped, and marked if already recorded.
  const savedCard = resumed?.card
  const recorded = hasRecordedCurrent(state) ? state.attempts[state.currentQuestionIndex] : null
  const restoredCard =
    savedCard && savedCard.questionId === state.currentRound.question.id
      ? {
          selectedAnswer: recorded?.userAnswer ?? savedCard.selectedAnswer,
          isCardFlipped: recorded ? true : savedCard.isCardFlipped,
          markedCorrect: recorded?.isCorrect ?? null,
          timeTakenMs: recorded?.timeTakenMs,
        }
      : undefined
  // For screen readers: progress after each answer is marked, and each new question.
  const announcement = hasRecordedCurrent(state)
    ? totalQuestions === null
      ? `${answered} answered, ${state.correctCount} right.`
      : `${answered} of ${totalQuestions} answered, ${state.correctCount} right.`
    : questionNumber > 1
      ? `Question ${questionNumber}${totalQuestions === null ? '' : ` of ${totalQuestions}`}.`
      : ''

  return (
    <PageContainer title={title}>
      <div className="practice-session">
        <LiveAnnouncement message={announcement} />
        {resumed && state.attempts.length === resumed.session.attempts.length && (
          <p className="session-resumed" role="status">
            Welcome back! You’re right where you left off.
          </p>
        )}
        {blocker.state === 'blocked' && (
          <LeaveSessionDialog
            answered={answered}
            onStay={() => blocker.reset()}
            onLeave={() => {
              setIsLeaving(true)
              endSession()
            }}
          />
        )}
        <SessionProgress answered={answered} total={totalQuestions} correct={state.correctCount} />
        <QuestionCard
          // A new key per question gives a fresh card: nothing selected, not flipped.
          key={state.currentRound.question.id}
          question={state.currentRound.question}
          choices={state.currentRound.choices}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          isLastQuestion={isOnLastQuestion(state)}
          animate={animate}
          autoFocus={questionNumber > 1}
          enterTransition={questionNumber > 1}
          onResult={recordResult}
          onNext={nextQuestion}
          getFeedback={getFeedback}
          onStateChange={handleCardChange}
          initialState={restoredCard}
        />
        <div className="session-actions">
          <EndSessionControl answered={answered} onEnd={endSession} />
        </div>
      </div>
    </PageContainer>
  )
}

export default PracticeSessionPage
