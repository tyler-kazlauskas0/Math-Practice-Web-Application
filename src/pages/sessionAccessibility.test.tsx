import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'

function renderSession(sessionLength: 5 | 'continuous' = 5) {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: ROUTES.practiceSession,
          state: { operations: ['addition'], difficulty: 'easy', sessionLength },
        },
      ]}
    >
      <App />
    </MemoryRouter>,
  )
  return { user, ...view }
}

/** The page's own announcement (the card has a separate one). */
const pageAnnouncement = () =>
  within(document.querySelector('.practice-session')!)
    .getAllByRole('status')
    .find((element) => !element.closest('.question-card'))!

async function markFirstAnswer(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('1')
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
}

describe('session announcements', () => {
  it('announces progress after each answer, then the next question', async () => {
    const { user } = renderSession()

    await markFirstAnswer(user)
    expect(pageAnnouncement()).toHaveTextContent('1 of 5 answered, 1 right.')

    await user.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(pageAnnouncement()).toHaveTextContent('Question 2 of 5.')
  })

  it('announces a running count in non-stop practice', async () => {
    const { user } = renderSession('continuous')

    await markFirstAnswer(user)
    expect(pageAnnouncement()).toHaveTextContent('1 answered, 1 right.')
  })
})

describe('reduced motion', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubReducedMotion(reduced: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  }

  it('turns off card animation when the device asks for reduced motion', () => {
    stubReducedMotion(true)
    const { container } = renderSession()

    expect(container.querySelector('.question-card')).toHaveClass('question-card--no-animation')
  })

  it('animates when neither the device nor the setting asks otherwise', () => {
    stubReducedMotion(false)
    const { container } = renderSession()

    expect(container.querySelector('.question-card')).not.toHaveClass('question-card--no-animation')
  })
})
