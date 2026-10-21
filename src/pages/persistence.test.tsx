import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { appRoutes } from '../routes'
import { ROUTES } from '../data/routes'
import { loadAttempts, loadRecentSessions } from '../services/practiceHistory'

function startApp(path: string, state?: unknown) {
  const user = userEvent.setup()
  const view = render(
    <App router={createMemoryRouter(appRoutes, { initialEntries: [{ pathname: path, state }] })} />,
  )
  return { user, ...view }
}

async function answerQuestion(user: ReturnType<typeof userEvent.setup>, markRight: boolean) {
  await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: markRight ? 'I Got It Right' : 'I Got It Wrong' }),
  )
}

describe('saved practice data', () => {
  it('saves each attempt as soon as it is marked, and keeps it after a restart', async () => {
    const config = { operations: ['subtraction'], difficulty: 'beginner', sessionLength: 5 }
    const { user, unmount } = startApp(ROUTES.practiceSession, config)

    await answerQuestion(user, false)
    const shownAnswer = Number(screen.getByText('Your answer').nextSibling?.textContent)
    // "Restart the browser": throw away the whole app, then start it again.
    unmount()
    startApp(ROUTES.home)

    const attempts = loadAttempts()
    expect(attempts).toHaveLength(1)
    expect(attempts[0]).toMatchObject({
      userAnswer: shownAnswer,
      isCorrect: false,
      question: { operation: 'subtraction', difficulty: 'beginner' },
    })
    const [session] = loadRecentSessions()
    expect(attempts[0].sessionId).toBe(session.id)
    expect(session).toMatchObject({ totalAttempts: 1, correctAttempts: 0, completedAt: null })
  })

  it('saves the completion time when a session finishes', async () => {
    const config = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }
    const { user } = startApp(ROUTES.practiceSession, config)

    for (let i = 0; i < 5; i++) {
      await answerQuestion(user, true)
      await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
    }

    const [session] = loadRecentSessions()
    expect(session.totalAttempts).toBe(5)
    expect(session.correctAttempts).toBe(5)
    expect(session.completedAt).toEqual(expect.any(String))
    expect(loadAttempts(session.id)).toHaveLength(5)
  })

  it('does not save a session where nothing was answered', () => {
    startApp(ROUTES.practiceSession, {
      operations: ['addition'],
      difficulty: 'easy',
      sessionLength: 5,
    })

    expect(loadRecentSessions()).toEqual([])
  })

  it('keeps changes made on the setup page to that one session', async () => {
    const { user, unmount } = startApp(ROUTES.practiceSetup)
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    await user.click(screen.getByRole('radio', { name: 'Advanced' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    unmount()
    startApp(ROUTES.practiceSetup)

    // Back to the defaults, not the one-off choices.
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Division' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked()
  })
})
