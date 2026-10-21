import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import { ROUTES } from '../data/routes'
import { loadSettings, SETTINGS_STORAGE_KEY } from '../services/settingsStorage'

function renderApp(path: string = ROUTES.settings) {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return { user, ...view }
}

const group = (name: string) => within(screen.getByRole('group', { name }))

describe('SettingsPage', () => {
  it.each([
    ['Sound effects', 'soundEnabled'],
    ['Card flip animation', 'animationsEnabled'],
    ['Show explanations', 'showExplanations'],
  ] as const)('saves the %s setting automatically', async (label, key) => {
    const { user } = renderApp()
    const toggle = screen.getByRole('checkbox', { name: label })
    expect(toggle).toBeChecked()

    await user.click(toggle)

    expect(toggle).not.toBeChecked()
    expect(loadSettings()[key]).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
  })

  it('saves default operations, difficulty, and session length', async () => {
    const { user } = renderApp()

    await user.click(group('Default operations').getByRole('checkbox', { name: 'Division' }))
    await user.click(group('Default difficulty').getByRole('radio', { name: 'Advanced' }))
    await user.click(group('Default session length').getByRole('radio', { name: 'Non-stop' }))

    expect(loadSettings()).toMatchObject({
      enabledOperations: ['addition', 'division'],
      difficulty: 'advanced',
      sessionLength: 'continuous',
    })
  })

  it('does not save an empty list of default operations', async () => {
    const { user } = renderApp()

    await user.click(group('Default operations').getByRole('checkbox', { name: 'Addition' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Pick at least one operation')
    expect(loadSettings().enabledOperations).toEqual(['addition'])
  })

  it('uses the defaults on the setup page, which can still be changed for one session', async () => {
    const { user, unmount } = renderApp()
    await user.click(group('Default operations').getByRole('checkbox', { name: 'Subtraction' }))
    await user.click(group('Default difficulty').getByRole('radio', { name: 'Beginner' }))
    await user.click(group('Default session length').getByRole('radio', { name: '20 questions' }))
    unmount()

    const setup = renderApp(ROUTES.practiceSetup)
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked()

    await setup.user.click(screen.getByRole('radio', { name: '5 questions' }))
    await setup.user.click(screen.getByRole('button', { name: 'Start Session' }))

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(loadSettings().sessionLength).toBe(20)
  })
})

describe('Clear All Application Data', () => {
  async function openConfirmation() {
    const result = renderApp()
    await result.user.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
    return result
  }

  it('shows a strong warning and needs DELETE typed before it works', async () => {
    const { user } = await openConfirmation()

    const dialog = screen.getByRole('alertdialog', { name: /delete everything/i })
    expect(dialog).toHaveAccessibleDescription(/can’t be undone/)
    const input = within(dialog).getByRole('textbox', { name: 'Type DELETE to confirm' })
    expect(input).toHaveFocus()
    const deleteButton = within(dialog).getByRole('button', { name: 'Delete Everything' })
    expect(deleteButton).toBeDisabled()

    await user.type(input, 'delet')
    expect(deleteButton).toBeDisabled()
    await user.type(input, 'e')
    expect(deleteButton).toBeEnabled()
  })

  it('can be cancelled', async () => {
    const { user } = await openConfirmation()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear All Application Data' })).toHaveFocus()
  })

  it('deletes all app data, restores defaults, and goes home', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ animationsEnabled: false }))
    localStorage.setItem('math-practice:sessions', '[]')
    localStorage.setItem('math-practice:attempts', '[]')
    localStorage.setItem('math-practice:history-archive', '{}')
    localStorage.setItem('math-practice:mistake-patterns', '[]')
    localStorage.setItem('other-app', 'keep me')
    const { user } = await openConfirmation()

    await user.type(screen.getByRole('textbox'), 'DELETE')
    await user.click(screen.getByRole('button', { name: 'Delete Everything' }))

    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('All app data was deleted')
    for (const key of ['sessions', 'attempts', 'history-archive', 'mistake-patterns']) {
      expect(localStorage.getItem(`math-practice:${key}`)).toBeNull()
    }
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(localStorage.getItem('other-app')).toBe('keep me')
  })
})
