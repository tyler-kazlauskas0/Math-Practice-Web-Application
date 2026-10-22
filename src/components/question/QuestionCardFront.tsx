import { memo, useEffect, type Ref } from 'react'
import type { Question } from '../../types/question'
import Button from '../ui/Button'
import { speakQuestion } from '../../utils/questions/spokenText'
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
  // Number keys 1–4 choose an answer, unless the player is typing somewhere or a dialog is open.
  useEffect(() => {
    if (isLocked) return
    function handleKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
      const target = event.target as HTMLElement | null
      if (
        target?.closest('input, textarea, select, [contenteditable="true"], [role="alertdialog"]')
      ) {
        return
      }
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < choices.length) {
        event.preventDefault()
        onSelect(choices[index])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [choices, isLocked, onSelect])

  return (
    <>
      <QuestionProgress questionNumber={questionNumber} totalQuestions={totalQuestions} />
      <h2
        className="question-card__problem"
        ref={headingRef}
        tabIndex={-1}
        aria-label={speakQuestion(question)}
      >
        {question.displayText} = ?
      </h2>
      <div className="answer-grid" role="group" aria-label="Answer choices">
        {choices.map((choice, index) => (
          <AnswerChoice
            key={choice}
            value={choice}
            shortcut={index + 1}
            isSelected={choice === selectedAnswer}
            isLocked={isLocked}
            onSelect={onSelect}
          />
        ))}
      </div>
      <p className="question-card__hint" id={`hint-${question.id}`}>
        {selectedAnswer === null ? (
          <>
            Pick an answer
            <span className="keyboard-only"> (or press 1, 2, 3, or 4)</span>, then flip the card.
          </>
        ) : (
          'Flip the card to check your answer.'
        )}
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

// Memoized: after flipping, the hidden front doesn't need to re-render as the back changes.
export default memo(QuestionCardFront)
