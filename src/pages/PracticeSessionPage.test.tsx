import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { appRoutes } from '../routes'
import { ROUTES } from '../data/routes'
import { makeQuestion } from '../test/makeQuestion'
import type { PracticeConfig } from '../types/session'
import { SETTINGS_STORAGE_KEY } from '../services/settingsStorage'

type User = ReturnType<typeof userEvent.setup>

function renderSession(state: unknown) {
  const user = userEvent.setup()
  const view = render(
    <App
      router={createMemoryRouter(appRoutes, {
        initialEntries: [{ pathname: ROUTES.practiceSession, state }],
      })}
    />,
  )
  return { user, ...view }
}

const config: PracticeConfig = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }
const progressBar = () => screen.getByRole('progressbar', { name: 'Session progress' })
const question = () => screen.getByRole('heading', { level: 2 }).textContent

async function flipAndMark(user: User, markRight: boolean) {
  await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: markRight ? 'I Got It Right' : 'I Got It Wrong' }),
  )
}

async function answerQuestion(user: User, markRight: boolean) {
  await flipAndMark(user, markRight)
  await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
}

describe('PracticeSessionPage', () => {
  beforeEach(() => localStorage.clear())

  it.each([
    ['missing', undefined],
    ['invalid', { operations: [], difficulty: 'easy', sessionLength: 5 }],
  ])('sends the player to setup when the session data is %s', (_, state) => {
    renderSession(state)

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()
    expect(screen.getByText(/choose what you want to practice/i)).toBeInTheDocument()
  })

  it('reads the setup and shows the first question card', () => {
    renderSession(config)

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(question()).toMatch(/^\d+ \+ \d+ = \?$/)
    expect(screen.getAllByRole('button', { name: /^Answer / })).toHaveLength(4)
  })

  it('updates progress as soon as each answer is marked', async () => {
    const { user } = renderSession(config)
    expect(progressBar()).toHaveAttribute('aria-valuenow', '0')
    expect(progressBar()).toHaveAttribute('aria-valuemax', '5')

    await flipAndMark(user, true)

    expect(progressBar()).toHaveAttribute('aria-valuenow', '1')
    expect(progressBar()).toHaveAttribute('aria-valuetext', '1 of 5 questions answered')
  })

  it('moves to a new, different question with a fresh card', async () => {
    const { user, container } = renderSession(config)
    const first = question()

    await answerQuestion(user, true)

    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(question()).not.toBe(first)
    expect(container.querySelector('.question-card')).not.toHaveClass('question-card--flipped')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    screen
      .getAllByRole('button', { name: /^Answer / })
      .forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'))
  })

  it('shows the summary after the last question', async () => {
    const { user } = renderSession(config)

    for (let i = 0; i < 5; i++) await answerQuestion(user, i !== 1)

    expect(screen.getByRole('heading', { level: 1, name: 'Great Practice!' })).toBeInTheDocument()
    const total = (label: string) => screen.getByText(label).nextSibling?.textContent
    expect(total('Questions')).toBe('5')
    expect(total('Right')).toBe('4')
    expect(total('Wrong')).toBe('1')
    expect(total('Accuracy')).toBe('80%')
    expect(total('To review')).toBe('1')
  })

  it('uses a short fade between questions only when animations are on', async () => {
    const { user, container } = renderSession(config)
    await answerQuestion(user, true)
    expect(container.querySelector('.question-card')).toHaveClass('question-card--enter')
  })

  it('skips the fade when animations are turned off', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ animationsEnabled: false }))
    const { user, container } = renderSession(config)

    await answerQuestion(user, true)

    expect(container.querySelector('.question-card')).not.toHaveClass('question-card--enter')
    expect(container.querySelector('.question-card')).toHaveClass('question-card--no-animation')
  })
})

describe('mistake review', () => {
  const mistakes = [makeQuestion(56, 'division', 7), makeQuestion(9, 'subtraction', 4)]

  it('asks each saved question once, in order, then shows the summary', async () => {
    const { user } = renderSession({ ...config, reviewQuestions: mistakes })
    expect(screen.getByRole('heading', { level: 1, name: 'Mistake Review' })).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    expect(question()).toBe('56 ÷ 7 = ?')

    await answerQuestion(user, true)
    expect(question()).toBe('9 − 4 = ?')

    await answerQuestion(user, false)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Mistake Review Done!' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Practice Mistakes (1)' })).toBeInTheDocument()
  })

  it('skips invalid saved questions, and goes to setup if none are left', () => {
    renderSession({ ...config, reviewQuestions: [{ ...mistakes[0], correctAnswer: 9 }] })

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()
  })
})

describe('non-stop practice', () => {
  const continuous: PracticeConfig = { ...config, sessionLength: 'continuous' }

  it('has no fixed end and shows a running count instead of a progress bar', async () => {
    const { user } = renderSession(continuous)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    for (let i = 0; i < 25; i++) await answerQuestion(user, true)

    expect(screen.getByText('Question 26')).toBeInTheDocument()
    expect(screen.getByText('25 questions answered · 25 right')).toBeInTheDocument()
  })

  it('asks before ending, and can keep going', async () => {
    const { user } = renderSession(continuous)
    await answerQuestion(user, true)

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(screen.getByRole('alertdialog', { name: 'End this session?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, End Session' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'End Session' })).toHaveFocus()
    expect(screen.getByText('Question 2')).toBeInTheDocument()
  })

  it('closes the question with Escape', async () => {
    const { user } = renderSession(continuous)
    await answerQuestion(user, true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows the summary after ending', async () => {
    const { user } = renderSession(continuous)
    await answerQuestion(user, true)
    await answerQuestion(user, false)
    await answerQuestion(user, true)

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Great Practice!' })).toBeInTheDocument()
    expect(screen.getByText('Questions').nextSibling).toHaveTextContent('3')
    expect(screen.getByText('Right').nextSibling).toHaveTextContent('2')
  })

  it('ends straight away, without asking, when nothing has been answered', async () => {
    const { user } = renderSession(continuous)

    await user.click(screen.getByRole('button', { name: 'End Session' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Session Ended' })).toBeInTheDocument()
  })
})
