import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'
import type { PracticeConfig } from '../types/session'
import { SETTINGS_STORAGE_KEY } from '../utils/settingsStorage'

function renderSession(config: PracticeConfig) {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter initialEntries={[{ pathname: ROUTES.practiceSession, state: config }]}>
      <App />
    </MemoryRouter>,
  )
  return { user, ...view }
}

const config: PracticeConfig = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }

/** Picks the first answer, flips, marks it, and moves on. */
async function answerQuestion(user: ReturnType<typeof userEvent.setup>, markRight: boolean) {
  await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: markRight ? 'I Got It Right' : 'I Got It Wrong' }),
  )
  await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
}

describe('PracticeSessionPage', () => {
  beforeEach(() => localStorage.clear())

  it('starts each new question unflipped with nothing selected', async () => {
    const { user, container } = renderSession(config)
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()

    await answerQuestion(user, true)

    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(container.querySelector('.question-card')).not.toHaveClass('question-card--flipped')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    screen
      .getAllByRole('button', { name: /^Answer / })
      .forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('= ?')
    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus()
  })

  it('finishes after the chosen number of questions', async () => {
    const { user } = renderSession(config)

    for (let i = 0; i < 5; i++) await answerQuestion(user, i % 2 === 0)

    expect(screen.getByRole('heading', { level: 1, name: 'All done!' })).toBeInTheDocument()
    expect(screen.getByText('You answered 5 questions and got 3 right.')).toBeInTheDocument()
  })

  it('keeps going in non-stop practice until the player stops', async () => {
    const { user } = renderSession({ ...config, sessionLength: 'continuous' })

    for (let i = 0; i < 3; i++) await answerQuestion(user, true)
    expect(screen.getByText('Question 4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stop Practicing' }))

    expect(screen.getByText('You answered 3 questions and got 3 right.')).toBeInTheDocument()
  })

  it('turns off the flip animation when the setting is off', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ animationsEnabled: false }))
    const { container } = renderSession(config)

    expect(container.querySelector('.question-card')).toHaveClass('question-card--no-animation')
  })
})
