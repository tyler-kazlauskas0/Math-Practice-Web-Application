import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'
import { SETTINGS_STORAGE_KEY } from '../services/settingsStorage'

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear())

  it('turns the card flip animation off and remembers it', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[ROUTES.settings]}>
        <App />
      </MemoryRouter>,
    )
    const toggle = screen.getByRole('checkbox', { name: 'Card flip animation' })
    expect(toggle).toBeChecked()

    await user.click(toggle)

    expect(toggle).not.toBeChecked()
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toMatchObject({
      animationsEnabled: false,
    })
  })
})
