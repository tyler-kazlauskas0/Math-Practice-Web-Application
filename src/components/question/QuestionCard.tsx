import { useCallback, useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import LiveAnnouncement from '../ui/LiveAnnouncement'
import QuestionCardBack from './QuestionCardBack'
import QuestionCardFront from './QuestionCardFront'
import './question.css'

/** What the card is showing, so it can be saved and restored after a page refresh. */
export interface QuestionCardState {
  selectedAnswer: number | null
  isCardFlipped: boolean
}

export interface QuestionCardResult {
  selectedAnswer: number
  markedCorrect: boolean
  /** Time from the card appearing to flipping it, in milliseconds. */
  timeTakenMs: number
}

interface QuestionCardProps {
  question: Question
  choices: number[]
  questionNumber: number
  /** `null` for non-stop practice. */
  totalQuestions: number | null
  isLastQuestion: boolean
  /** Animate the flip. When `false` (or the device asks for reduced motion) the card switches sides instantly. */
  animate: boolean
  /** Move keyboard focus to the question when the card appears. Use for every question after the first. */
  autoFocus?: boolean
  /** Fade the card in. Use for every question after the first. Skipped when `animate` is false. */
  enterTransition?: boolean
  /** Called once, when the player marks the answer right or wrong. */
  onResult: (result: QuestionCardResult) => void
  /** Called when the player presses Next Question or Finish. */
  onNext: () => void
  /** Picks an encouraging message after marking, or returns `null` for none (feedback turned off). */
  getFeedback?: (markedCorrect: boolean) => string | null
  /** Where the card starts, e.g. restored after a refresh. Defaults to a fresh card. */
  initialState?: QuestionCardState & { markedCorrect: boolean | null; timeTakenMs?: number }
  /** Called whenever the selected answer or flip changes. */
  onStateChange?: (state: QuestionCardState) => void
}

/**
 * A two-sided question card. The front asks the question; after the player picks an answer
 * and flips the card, the back shows the correct answer and asks them to mark themselves.
 *
 * Give each question its own `key` so a new question starts with a fresh, unflipped card.
 */
function QuestionCard({
  question,
  choices,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  animate,
  autoFocus = false,
  enterTransition = false,
  onResult,
  onNext,
  getFeedback,
  initialState,
  onStateChange,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    initialState?.selectedAnswer ?? null,
  )
  const [isCardFlipped, setIsCardFlipped] = useState(initialState?.isCardFlipped ?? false)
  const [markedCorrect, setMarkedCorrect] = useState<boolean | null>(
    initialState?.markedCorrect ?? null,
  )
  const [timeTakenMs, setTimeTakenMs] = useState(initialState?.timeTakenMs ?? 0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const shownAtRef = useRef(0)

  const frontHeadingRef = useRef<HTMLHeadingElement>(null)
  const backHeadingRef = useRef<HTMLHeadingElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    onStateChange?.({ selectedAnswer, isCardFlipped })
  }, [selectedAnswer, isCardFlipped, onStateChange])

  useEffect(() => {
    if (autoFocus) frontHeadingRef.current?.focus()
  }, [autoFocus])

  // Keep keyboard and screen-reader users on the visible side of the card.
  useEffect(() => {
    if (isCardFlipped) backHeadingRef.current?.focus()
  }, [isCardFlipped])

  useEffect(() => {
    if (markedCorrect !== null) nextButtonRef.current?.focus()
  }, [markedCorrect])

  // Stable between renders, so the front of the card (memoized) only re-renders when what it
  // shows changes, and its number-key listener isn't removed and re-added every time.
  const selectAnswer = useCallback(
    (answer: number) => {
      if (!isCardFlipped) setSelectedAnswer(answer)
    },
    [isCardFlipped],
  )
  const flip = useCallback(() => {
    if (selectedAnswer === null) return
    setTimeTakenMs(Date.now() - shownAtRef.current)
    setIsCardFlipped(true)
  }, [selectedAnswer])

  const classes = [
    'question-card',
    isCardFlipped && 'question-card--flipped',
    !animate && 'question-card--no-animation',
    animate && enterTransition && 'question-card--enter',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes} aria-label={`Question ${questionNumber}`}>
      <LiveAnnouncement
        message={
          isCardFlipped && markedCorrect === null
            ? `The correct answer is ${question.correctAnswer}. You chose ${selectedAnswer}.`
            : (feedback ?? '')
        }
      />
      <div className="question-card__inner">
        {/* The hidden side is inert so it can't be focused, clicked, or read out. */}
        <div
          className="question-card__face question-card__face--front"
          inert={isCardFlipped}
          aria-hidden={isCardFlipped}
        >
          <QuestionCardFront
            question={question}
            choices={choices}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswer}
            isLocked={isCardFlipped}
            onSelect={selectAnswer}
            onFlip={flip}
            headingRef={frontHeadingRef}
          />
        </div>
        <div
          className="question-card__face question-card__face--back"
          inert={!isCardFlipped}
          aria-hidden={!isCardFlipped}
        >
          {/* Only filled in after flipping, so the answer isn't in the page beforehand. */}
          {isCardFlipped && selectedAnswer !== null && (
            <QuestionCardBack
              question={question}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              selectedAnswer={selectedAnswer}
              markedCorrect={markedCorrect}
              feedback={feedback}
              animate={animate}
              isLastQuestion={isLastQuestion}
              onMark={(value) => {
                if (markedCorrect !== null) return
                setMarkedCorrect(value)
                setFeedback(getFeedback?.(value) ?? null)
                onResult({ selectedAnswer, markedCorrect: value, timeTakenMs })
              }}
              onNext={() => {
                if (markedCorrect !== null) onNext()
              }}
              headingRef={backHeadingRef}
              nextButtonRef={nextButtonRef}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default QuestionCard
