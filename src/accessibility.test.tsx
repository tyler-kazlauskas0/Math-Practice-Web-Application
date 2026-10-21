import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { appRoutes } from './routes'
import { ROUTES } from './data/routes'
import { saveMistakePatterns } from './services/mistakePatterns'
import { saveAttempt, saveSession } from './services/practiceHistory'
import { findAccessibilityViolations } from './test/axe'
import { makePattern } from './test/makePattern'
import { makeQuestion } from './test/makeQuestion'

function renderAt(path: string, state?: unknown) {
  const user = userEvent.setup()
  render(
    <App router={createMemoryRouter(appRoutes, { initialEntries: [{ pathname: path, state }] })} />,
  )
  return user
}

function seedData() {
  saveMistakePatterns([
    makePattern(7, 'multiplication', 8),
    makePattern(3, 'addition', 4, { masteredAt: '2026-10-22T10:00:00.000Z' }),
  ])
  saveAttempt({
    sessionId: 's1',
    question: makeQuestion(7, 'multiplication', 8),
    userAnswer: 54,
    isCorrect: false,
    timeTakenMs: 1000,
    answeredAt: '2026-10-22T10:00:00.000Z',
  })
  saveSession({
    id: 's1',
    config: { operations: ['multiplication'], difficulty: 'easy', sessionLength: 5 },
    isReview: false,
    startedAt: '2026-10-22T10:00:00.000Z',
    completedAt: null,
    totalAttempts: 1,
    correctAttempts: 0,
  })
}

const session = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }

describe('automated accessibility checks (axe)', () => {
  it.each([
    ['home', ROUTES.home],
    ['practice setup', ROUTES.practiceSetup],
    ['statistics', ROUTES.statistics],
    ['mistakes', ROUTES.mistakes],
    ['settings', ROUTES.settings],
    ['not found', '/nope'],
  ])('finds no problems on the %s page', async (_, path) => {
    seedData()
    renderAt(path)

    expect(await findAccessibilityViolations()).toEqual([])
  })

  it('finds no problems on the question card, front and back', async () => {
    const user = renderAt(ROUTES.practiceSession, session)
    expect(await findAccessibilityViolations()).toEqual([])

    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(await findAccessibilityViolations()).toEqual([])

    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(await findAccessibilityViolations()).toEqual([])
  })

  it('finds no problems on the summary page', async () => {
    const user = renderAt(ROUTES.practiceSession, session)
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.click(
        screen.getByRole('button', { name: i % 2 ? 'I Got It Right' : 'I Got It Wrong' }),
      )
      await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
    }

    expect(await findAccessibilityViolations()).toEqual([])
  })

  it('finds no problems in the leave-session warning', async () => {
    const user = renderAt(ROUTES.practiceSession, session)
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await user.click(screen.getByRole('link', { name: 'Statistics' }))
    expect(screen.getByRole('alertdialog', { name: /leave/i })).toBeInTheDocument()

    expect(await findAccessibilityViolations()).toEqual([])
  })

  it('finds no problems in the confirmation dialogs', async () => {
    seedData()
    const user = renderAt(ROUTES.settings)
    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
    expect(await findAccessibilityViolations()).toEqual([])
  })
})
