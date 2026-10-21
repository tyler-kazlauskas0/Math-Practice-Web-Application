import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { ROUTES } from '../../data/routes'
import { appRoutes } from '../../routes'
import { checkAndRepairStoredData } from '../../services/dataHealth'

function renderApp(path: string = ROUTES.home) {
  const user = userEvent.setup()
  render(<App router={createMemoryRouter(appRoutes, { initialEntries: [path] })} />)
  return user
}

describe('saved-data notices', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    checkAndRepairStoredData() // Clear the startup report for the next test.
  })

  it('explains repairs made at startup in plain words, and can be dismissed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('math-practice:settings', '{broken')
    localStorage.setItem('math-practice:attempts', '["junk"]')
    checkAndRepairStoredData()
    const user = renderApp()

    const notice = screen.getByText(/some saved data couldn’t be read/i)
    expect(notice).toHaveTextContent(
      'Some saved data couldn’t be read, so your settings had to be started fresh, and a few damaged entries were removed from your answers. Everything else is just as you left it.',
    )
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(screen.queryByText(/some saved data/i)).toBeNull()
  })

  it('shows nothing when saved data is fine', () => {
    checkAndRepairStoredData()
    renderApp()

    expect(screen.queryByText(/saved data/i)).toBeNull()
  })

  it('explains, without jargon, when storage is blocked', async () => {
    const user = renderApp(ROUTES.settings)
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    await user.click(screen.getByRole('checkbox', { name: 'Sound effects' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/isn’t letting the app save anything/)
    expect(alert).toHaveTextContent(/you can keep practicing/i)
    expect(alert).not.toHaveTextContent(/localStorage|SecurityError|quota/i)
  })

  it('explains when storage is full', async () => {
    const user = renderApp(ROUTES.settings)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })

    await user.click(screen.getByRole('checkbox', { name: 'Sound effects' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/out of space/i)
  })
})
