import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { ROUTES } from './data/routes'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('shows the app title and main navigation on every page', () => {
    renderAt(ROUTES.statistics)

    expect(screen.getByRole('link', { name: 'Math Practice' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it.each([
    [ROUTES.practiceSetup, 'Practice Setup'],
    [ROUTES.practiceSummary, 'Practice Summary'],
    [ROUTES.statistics, 'Statistics'],
    [ROUTES.settings, 'Settings'],
  ])('renders the page for %s', (path, heading) => {
    renderAt(path)

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('sends the practice session page to setup when there is no session', () => {
    renderAt(ROUTES.practiceSession)

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown routes', () => {
    renderAt('/does-not-exist')

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/')
  })

  it('marks the current section in the navigation', () => {
    renderAt(ROUTES.practiceSession)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    const practiceLink = screen
      .getAllByRole('link', { name: 'Practice' })
      .find((link) => nav.contains(link))
    expect(practiceLink).toHaveAttribute('aria-current', 'page')
  })
})

describe('HomePage', () => {
  it('shows a welcome message', () => {
    renderAt(ROUTES.home)

    expect(
      screen.getByRole('heading', { level: 1, name: /welcome to math practice/i }),
    ).toBeInTheDocument()
  })

  it.each([
    ['Start Practice', ROUTES.practiceSetup, 'Practice Setup'],
    ['View Statistics', ROUTES.statistics, 'Statistics'],
    ['Settings', ROUTES.settings, 'Settings'],
  ])('the "%s" button goes to %s', async (buttonName, path, heading) => {
    const user = userEvent.setup()
    renderAt(ROUTES.home)

    const main = screen.getByRole('main')
    const button = screen
      .getAllByRole('link', { name: buttonName })
      .find((link) => main.contains(link))
    expect(button).toHaveAttribute('href', path)

    await user.click(button!)

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('can be used with the keyboard alone', async () => {
    const user = userEvent.setup()
    renderAt(ROUTES.home)

    // Tab past the skip link, the title, and the four navigation links to the first button.
    for (let i = 0; i < 7; i++) await user.tab()
    expect(document.activeElement).toHaveTextContent('Start Practice')

    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()
  })
})
