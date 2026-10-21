import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'
import { appRoutes } from '../routes'
import { loadActiveSession } from '../services/activeSession'
import { loadRecentSessions } from '../services/practiceHistory'
import { answerValue } from '../test/practice'

type User = ReturnType<typeof userEvent.setup>

const config = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }

/** Opens the app. Using the same `key` again acts like refreshing that browser page. */
function open(entries: { pathname: string; state?: unknown; key?: string }[], index?: number) {
  const user = userEvent.setup()
  const router = createMemoryRouter(appRoutes, { initialEntries: entries, initialIndex: index })
  const view = render(<App router={router} />)
  return { user, router, ...view }
}

const question = () => screen.getByRole('heading', { level: 2 }).textContent
const nav = () => within(screen.getByRole('navigation', { name: 'Main' }))

async function answer(user: User) {
  await user.keyboard('1')
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
  await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
}

describe('restoring a session after a refresh', () => {
  it('comes back to the same question with the same answer selected', async () => {
    const first = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    await answer(first.user)
    await answer(first.user)
    await first.user.keyboard('3')
    const shown = question()
    const chosen = `Answer ${answerValue(screen.getAllByRole('button', { name: /^Answer / })[2])}`
    first.unmount()

    open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])

    expect(screen.getByText('Question 3 of 5')).toBeInTheDocument()
    expect(question()).toBe(shown)
    expect(screen.getByRole('button', { name: chosen! })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/right where you left off/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  })

  it('restores a flipped card, and a marked one with its Next button', async () => {
    const first = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    await first.user.keyboard('2')
    await first.user.click(screen.getByRole('button', { name: 'Flip Card' }))
    first.unmount()

    const second = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    expect(screen.getByText('Did you get it right?')).toBeInTheDocument()
    await second.user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    second.unmount()

    open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    expect(screen.getByRole('button', { name: 'I Got It Wrong' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Next Question' })).toBeInTheDocument()
  })

  it('starts a new session when a new one is started (a new history entry)', async () => {
    const first = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    await answer(first.user)
    first.unmount()

    open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-2' }])

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.queryByText(/right where you left off/i)).toBeNull()
  })

  it('offers to resume an unfinished session from the setup page', async () => {
    const first = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    await answer(first.user)
    first.unmount()

    const { user } = open([{ pathname: ROUTES.practiceSetup }])
    const banner = within(screen.getByRole('region', { name: /session in progress/i }))
    expect(banner.getByText('Question 2 of 5 · 1 answered')).toBeInTheDocument()
    await user.click(banner.getByRole('link', { name: 'Resume Session' }))

    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
  })

  it('forgets the saved session once it ends', async () => {
    const { user } = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    expect(loadActiveSession()).not.toBeNull()

    for (let i = 0; i < 5; i++) await answer(user)

    expect(screen.getByRole('heading', { level: 1, name: 'Great Practice!' })).toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
  })
})

describe('leaving a session in progress', () => {
  async function startAndAnswerOne() {
    const result = open(
      [
        { pathname: ROUTES.home, key: 'home' },
        { pathname: ROUTES.practiceSession, state: config, key: 'tab-1' },
      ],
      1,
    )
    await answer(result.user)
    return result
  }

  it('asks first, and Keep Practicing stays on the session', async () => {
    const { user } = await startAndAnswerOne()

    await user.click(nav().getByRole('link', { name: 'Statistics' }))

    const dialog = screen.getByRole('alertdialog', { name: 'Leave this practice session?' })
    expect(within(dialog).getByRole('button', { name: 'Keep Practicing' })).toHaveFocus()
    await user.click(within(dialog).getByRole('button', { name: 'Keep Practicing' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
  })

  it('closes the question with Escape, staying on the session', async () => {
    const { user } = await startAndAnswerOne()
    await user.click(nav().getByRole('link', { name: 'Settings' }))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
  })

  it('can end the session and go where the player was heading', async () => {
    const { user } = await startAndAnswerOne()
    await user.click(nav().getByRole('link', { name: 'Statistics' }))

    await user.click(screen.getByRole('button', { name: 'End Session and Leave' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument()
    const [saved] = loadRecentSessions()
    expect(saved.totalAttempts).toBe(1)
    expect(saved.completedAt).not.toBeNull()
    expect(loadActiveSession()).toBeNull()
  })

  it('also asks when the browser Back button is used', async () => {
    const { router } = await startAndAnswerOne()

    await act(() => router.navigate(-1))

    expect(
      screen.getByRole('alertdialog', { name: 'Leave this practice session?' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(ROUTES.practiceSession)
  })

  it('does not ask before anything has been answered, and forgets that session', async () => {
    const { user } = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])

    await user.click(nav().getByRole('link', { name: 'Statistics' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
  })

  it('does not ask once the session is finished', async () => {
    const { user } = open([{ pathname: ROUTES.practiceSession, state: config, key: 'tab-1' }])
    for (let i = 0; i < 5; i++) await answer(user)

    await user.click(nav().getByRole('link', { name: 'Home' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument()
  })

  it('does not ask when ending with the End Session button', async () => {
    const { user } = await startAndAnswerOne()

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))

    expect(screen.queryByRole('alertdialog', { name: /leave/i })).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Great Practice!' })).toBeInTheDocument()
  })
})
