import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeQuestion } from '../../test/makeQuestion'
import QuestionCard from './QuestionCard'

const question = makeQuestion(7, 'multiplication', 8)
const choices = [54, 56, 63, 48]

function renderCard(props: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  const view = render(
    <QuestionCard
      question={question}
      choices={choices}
      questionNumber={3}
      totalQuestions={10}
      isLastQuestion={false}
      animate
      onComplete={onComplete}
      {...props}
    />,
  )
  return { user, onComplete, ...view }
}

const flipButton = () => screen.getByRole('button', { name: 'Flip Card' })
const choice = (value: number) => screen.getByRole('button', { name: `Answer ${value}` })

describe('QuestionCard front', () => {
  it('shows the question, its number, and four answer choices', () => {
    renderCard()

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('7 × 8 = ?')
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Answer choices' })
    expect(
      within(group)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['54', '56', '63', '48'])
  })

  it('shows only the question number in non-stop practice', () => {
    renderCard({ totalQuestions: null })

    expect(screen.getByText('Question 3')).toBeInTheDocument()
  })

  it('keeps Flip Card disabled until an answer is selected', async () => {
    const { user } = renderCard()
    expect(flipButton()).toBeDisabled()

    await user.click(choice(63))

    expect(flipButton()).toBeEnabled()
  })

  it('highlights the selected answer and allows changing it before flipping', async () => {
    const { user } = renderCard()

    await user.click(choice(63))
    expect(choice(63)).toHaveAttribute('aria-pressed', 'true')

    await user.click(choice(56))
    expect(choice(56)).toHaveAttribute('aria-pressed', 'true')
    expect(choice(63)).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('QuestionCard flipping', () => {
  it('shows the front before flipping, and nothing from the back', () => {
    renderCard()

    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'I Got It Right' })).not.toBeInTheDocument()
  })

  it('shows the back after flipping: the question, correct answer, and chosen answer', async () => {
    const { user, container } = renderCard()

    await user.click(choice(54))
    await user.click(flipButton())

    expect(container.querySelector('.question-card')).toHaveClass('question-card--flipped')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('7 × 8 = 56')
    expect(screen.getByText('Correct answer').nextSibling).toHaveTextContent('56')
    expect(screen.getByText('Your answer').nextSibling).toHaveTextContent('54')
    // The back is focused so keyboard users continue from there.
    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus()
  })

  it('locks the answer after flipping: the front is hidden and its choices disabled', async () => {
    const { user, container } = renderCard()

    await user.click(choice(54))
    await user.click(flipButton())

    const front = container.querySelector('.question-card__face--front')!
    expect(front).toHaveAttribute('inert')
    expect(front).toHaveAttribute('aria-hidden', 'true')
    within(front as HTMLElement)
      .getAllByRole('button', { hidden: true })
      .forEach((button) => expect(button).toBeDisabled())
  })

  it('works with animation turned off', async () => {
    const { user, container } = renderCard({ animate: false })

    expect(container.querySelector('.question-card')).toHaveClass('question-card--no-animation')
    await user.click(choice(56))
    await user.click(flipButton())

    expect(screen.getByText('Did you get it right?')).toBeInTheDocument()
  })
})

describe('QuestionCard back', () => {
  async function flipWith(answer: number, props = {}) {
    const result = renderCard(props)
    await result.user.click(choice(answer))
    await result.user.click(flipButton())
    return result
  }

  it('lets the player mark only one of right or wrong', async () => {
    const { user } = await flipWith(56)
    const right = screen.getByRole('button', { name: 'I Got It Right' })
    const wrong = screen.getByRole('button', { name: 'I Got It Wrong' })

    await user.click(right)

    expect(right).toHaveAttribute('aria-pressed', 'true')
    expect(right).toBeDisabled()
    expect(wrong).toBeDisabled()
    expect(wrong).toHaveAttribute('aria-pressed', 'false')

    await user.click(wrong)
    expect(wrong).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows Next Question after marking, and reports the result', async () => {
    const { user, onComplete } = await flipWith(54)
    expect(screen.queryByRole('button', { name: 'Next Question' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    const next = screen.getByRole('button', { name: 'Next Question' })
    expect(next).toHaveFocus()

    await user.click(next)

    expect(onComplete).toHaveBeenCalledWith({ selectedAnswer: 54, markedCorrect: false })
  })

  it('says Finish on the last question', async () => {
    const { user } = await flipWith(56, { isLastQuestion: true })

    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))

    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
  })
})
