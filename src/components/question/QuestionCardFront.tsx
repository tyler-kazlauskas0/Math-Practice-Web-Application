import type { Ref } from 'react'
import type { Question } from '../../types/question'
import Button from '../ui/Button'
import AnswerChoice from './AnswerChoice'
import QuestionProgress from './QuestionProgress'

interface QuestionCardFrontProps {
  question: Question
  choices: number[]
  questionNumber: number
  totalQuestions: number | null
  selectedAnswer: number | null
  isLocked: boolean
  onSelect: (answer: number) => void
  onFlip: () => void
  headingRef?: Ref<HTMLHeadingElement>
}

/** The front of the card: the question, four answer choices, and the Flip Card button. */
function QuestionCardFront({
  question,
  choices,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isLocked,
  onSelect,
  onFlip,
  headingRef,
}: QuestionCardFrontProps) {
  return (
    <>
      <QuestionProgress questionNumber={questionNumber} totalQuestions={totalQuestions} />
      <h2 className="question-card__problem" ref={headingRef} tabIndex={-1}>
        {question.displayText} = ?
      </h2>
      <div className="answer-grid" role="group" aria-label="Answer choices">
        {choices.map((choice) => (
          <AnswerChoice
            key={choice}
            value={choice}
            isSelected={choice === selectedAnswer}
            isLocked={isLocked}
            onSelect={onSelect}
          />
        ))}
      </div>
      <p className="question-card__hint" id={`hint-${question.id}`}>
        {selectedAnswer === null
          ? 'Pick an answer, then flip the card.'
          : 'Flip the card to check your answer.'}
      </p>
      <Button
        className="question-card__action"
        disabled={selectedAnswer === null || isLocked}
        aria-describedby={`hint-${question.id}`}
        onClick={onFlip}
      >
        Flip Card
      </Button>
    </>
  )
}

export default QuestionCardFront
