import type { Ref } from 'react'
import type { Question } from '../../types/question'
import Button from '../ui/Button'
import { speakAnswer } from '../../utils/questions/spokenText'
import QuestionProgress from './QuestionProgress'

interface QuestionCardBackProps {
  question: Question
  questionNumber: number
  totalQuestions: number | null
  selectedAnswer: number
  /** The player's own verdict, or `null` until they choose. */
  markedCorrect: boolean | null
  /** An encouraging message shown after marking, if feedback is on. */
  feedback?: string | null
  /** Whether the message may pop in (off without animation). */
  animate?: boolean
  isLastQuestion: boolean
  onMark: (markedCorrect: boolean) => void
  onNext: () => void
  headingRef?: Ref<HTMLHeadingElement>
  nextButtonRef?: Ref<HTMLButtonElement>
}

/** The back of the card: the answer, the player's choice, and buttons to mark it right or wrong. */
function QuestionCardBack({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  markedCorrect,
  feedback = null,
  animate = false,
  isLastQuestion,
  onMark,
  onNext,
  headingRef,
  nextButtonRef,
}: QuestionCardBackProps) {
  const hasMarked = markedCorrect !== null

  return (
    <>
      <p className="question-card__side">Answer side</p>
      <QuestionProgress questionNumber={questionNumber} totalQuestions={totalQuestions} />
      <h2
        className="question-card__problem"
        ref={headingRef}
        tabIndex={-1}
        aria-label={speakAnswer(question)}
      >
        {question.displayText} = {question.correctAnswer}
      </h2>
      <dl className="answer-comparison">
        <div className="answer-comparison__item">
          <dt>Correct answer</dt>
          <dd>{question.correctAnswer}</dd>
        </div>
        <div className="answer-comparison__item">
          <dt>Your answer</dt>
          <dd>{selectedAnswer}</dd>
        </div>
      </dl>
      <div className="self-check" role="group" aria-labelledby={`self-check-${question.id}`}>
        <p className="self-check__question" id={`self-check-${question.id}`}>
          Did you get it right?
        </p>
        <div className="self-check__buttons">
          {/* Once either is chosen both are disabled, so only one can count for this question. */}
          <Button
            variant="success"
            aria-pressed={markedCorrect === true}
            disabled={hasMarked}
            onClick={() => onMark(true)}
          >
            {markedCorrect === true && <span aria-hidden="true">✓ </span>}I Got It Right
          </Button>
          <Button
            variant="danger"
            aria-pressed={markedCorrect === false}
            disabled={hasMarked}
            onClick={() => onMark(false)}
          >
            {markedCorrect === false && <span aria-hidden="true">✓ </span>}I Got It Wrong
          </Button>
        </div>
      </div>
      {hasMarked && feedback && (
        // Read out through the card's announcement, so hidden from screen readers here.
        <p
          className={`card-feedback card-feedback--${markedCorrect ? 'positive' : 'supportive'}${
            animate ? ' card-feedback--pop' : ''
          }`}
          aria-hidden="true"
        >
          <span className="card-feedback__icon">{markedCorrect ? '🌟' : '💪'}</span> {feedback}
        </p>
      )}
      {hasMarked && (
        <Button className="question-card__action" ref={nextButtonRef} onClick={onNext}>
          {isLastQuestion ? 'Finish' : 'Next Question'}
        </Button>
      )}
    </>
  )
}

export default QuestionCardBack
