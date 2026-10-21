import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { appRoutes } from '../routes'
import { ROUTES } from '../data/routes'
import { SETTINGS_STORAGE_KEY } from '../services/settingsStorage'
import { POSITIVE_FEEDBACK, SUPPORTIVE_FEEDBACK } from '../utils/feedback'

function renderSession() {
  const user = userEvent.setup()
  const view = render(
    <App
      router={createMemoryRouter(appRoutes, {
        initialEntries: [
          {
            pathname: ROUTES.practiceSession,
            state: { operations: ['addition'], difficulty: 'easy', sessionLength: 5 },
          },
        ],
      })}
    />,
  )
  return { user, ...view }
}

async function mark(user: ReturnType<typeof userEvent.setup>, right: boolean) {
  await user.keyboard('1')
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: right ? 'I Got It Right' : 'I Got It Wrong' }),
  )
}

const shownFeedback = (container: HTMLElement) => container.querySelector('.card-feedback')
const cardAnnouncement = (container: HTMLElement) =>
  within(container.querySelector('.question-card') as HTMLElement).getByRole('status')

describe('encouraging feedback', () => {
  it('shows and announces praise after a right answer', async () => {
    const { user, container } = renderSession()

    await mark(user, true)

    const message = shownFeedback(container)?.textContent?.replace('🌟', '').trim()
    expect(POSITIVE_FEEDBACK).toContain(message)
    expect(cardAnnouncement(container)).toHaveTextContent(message!)
  })

  it('shows a supportive message after a wrong answer', async () => {
    const { user, container } = renderSession()

    await mark(user, false)

    const message = shownFeedback(container)?.textContent?.replace('💪', '').trim()
    expect(SUPPORTIVE_FEEDBACK).toContain(message)
  })

  it('can be turned off in Settings', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ feedbackEnabled: false }))
    const { user, container } = renderSession()

    await mark(user, true)

    expect(shownFeedback(container)).toBeNull()
    expect(cardAnnouncement(container)).toBeEmptyDOMElement()
  })

  it('only pops in when animations are on', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ animationsEnabled: false }))
    const { user, container } = renderSession()

    await mark(user, true)

    expect(shownFeedback(container)).not.toHaveClass('card-feedback--pop')
  })

  it('has a Settings toggle', async () => {
    const user = userEvent.setup()
    render(<App router={createMemoryRouter(appRoutes, { initialEntries: [ROUTES.settings] })} />)
    const toggle = screen.getByRole('checkbox', { name: 'Encouraging messages' })
    expect(toggle).toBeChecked()

    await user.click(toggle)

    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toMatchObject({
      feedbackEnabled: false,
    })
  })

  it('adds a friendly line to the summary, unless turned off', async () => {
    const { user, unmount } = renderSession()
    for (let i = 0; i < 5; i++) {
      await mark(user, true)
      await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
    }
    expect(screen.getByText(/amazing work/i)).toBeInTheDocument()
    unmount()

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ feedbackEnabled: false }))
    const second = renderSession()
    for (let i = 0; i < 5; i++) {
      await mark(second.user, true)
      await second.user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
    }
    expect(screen.queryByText(/amazing work/i)).toBeNull()
  })
})
