import { useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import QuestionCardBack from './QuestionCardBack'
import QuestionCardFront from './QuestionCardFront'
import './question.css'

export interface QuestionCardResult {
  selectedAnswer: number
  markedCorrect: boolean
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
  /** Called when the player is done with this card and presses Next or Finish. */
  onComplete: (result: QuestionCardResult) => void
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
  onComplete,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [markedCorrect, setMarkedCorrect] = useState<boolean | null>(null)

  const frontHeadingRef = useRef<HTMLHeadingElement>(null)
  const backHeadingRef = useRef<HTMLHeadingElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

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

  const classes = [
    'question-card',
    isCardFlipped && 'question-card--flipped',
    !animate && 'question-card--no-animation',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes} aria-label={`Question ${questionNumber}`}>
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
            onSelect={(answer) => {
              if (!isCardFlipped) setSelectedAnswer(answer)
            }}
            onFlip={() => {
              if (selectedAnswer !== null) setIsCardFlipped(true)
            }}
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
              isLastQuestion={isLastQuestion}
              onMark={(value) => {
                if (markedCorrect === null) setMarkedCorrect(value)
              }}
              onNext={() => {
                if (markedCorrect !== null) onComplete({ selectedAnswer, markedCorrect })
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
