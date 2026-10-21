import { useState } from 'react'
import { useLocation } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import '../components/practice/practice.css'
import QuestionCard from '../components/question/QuestionCard'
import Button from '../components/ui/Button'
import ButtonLink from '../components/ui/ButtonLink'
import { ROUTES } from '../data/routes'
import { useSettings } from '../hooks/useSettings'
import type { Question } from '../types/question'
import type { PracticeConfig } from '../types/session'
import { isPracticeConfig } from '../utils/practiceConfig'
import { createAnswerChoices } from '../utils/questions/answerChoices'
import { generatePracticeQuestion } from '../utils/questions/generateQuestion'

interface Round {
  question: Question
  choices: number[]
}

function createRound(config: PracticeConfig): Round {
  const question = generatePracticeQuestion(config.operations, config.difficulty)
  return { question, choices: createAnswerChoices(question) }
}

function PracticeSessionPage() {
  const { state } = useLocation()

  // The setup page passes the configuration as navigation state. Without it there is
  // nothing to practice, e.g. when this page is opened from a bookmark.
  if (!isPracticeConfig(state)) {
    return (
      <PageContainer title="Practice">
        <p>First, choose what you want to practice.</p>
        <ButtonLink to={ROUTES.practiceSetup}>Set Up Practice</ButtonLink>
      </PageContainer>
    )
  }

  return <PracticeSession config={state} />
}

/** Runs a practice session: shows question cards one at a time until the session ends. */
function PracticeSession({ config }: { config: PracticeConfig }) {
  const { settings } = useSettings()
  const totalQuestions = config.sessionLength === 'continuous' ? null : config.sessionLength

  const [round, setRound] = useState<Round | null>(() => {
    try {
      return createRound(config)
    } catch {
      return null
    }
  })
  const [questionNumber, setQuestionNumber] = useState(1)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  if (round === null) {
    return (
      <PageContainer title="Practice">
        <p role="alert">Something went wrong while making a question. Please try again.</p>
        <ButtonLink to={ROUTES.practiceSetup}>Back to Setup</ButtonLink>
      </PageContainer>
    )
  }

  // A simple wrap-up for now; the full summary page comes later.
  if (isFinished) {
    return (
      <PageContainer title="All done!">
        <p>
          You answered {answeredCount} {answeredCount === 1 ? 'question' : 'questions'} and got{' '}
          {correctCount} right.
        </p>
        <div className="session-actions">
          <ButtonLink to={ROUTES.practiceSetup}>Practice Again</ButtonLink>
          <ButtonLink to={ROUTES.home} variant="secondary">
            Home
          </ButtonLink>
        </div>
      </PageContainer>
    )
  }

  const isLastQuestion = totalQuestions !== null && questionNumber >= totalQuestions

  return (
    <PageContainer title="Practice">
      <QuestionCard
        // A new key per question gives each one a fresh, unflipped card with nothing selected.
        key={round.question.id}
        question={round.question}
        choices={round.choices}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        isLastQuestion={isLastQuestion}
        animate={settings.animationsEnabled}
        autoFocus={questionNumber > 1}
        onComplete={({ markedCorrect }) => {
          setAnsweredCount((count) => count + 1)
          if (markedCorrect) setCorrectCount((count) => count + 1)
          if (isLastQuestion) {
            setIsFinished(true)
            return
          }
          try {
            setRound(createRound(config))
            setQuestionNumber((number) => number + 1)
          } catch {
            setRound(null)
          }
        }}
      />
      {totalQuestions === null && (
        <div className="session-actions">
          <Button variant="secondary" onClick={() => setIsFinished(true)}>
            Stop Practicing
          </Button>
        </div>
      )}
    </PageContainer>
  )
}

export default PracticeSessionPage
