import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'

function renderSetupPage() {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[ROUTES.practiceSetup]}>
      <App />
    </MemoryRouter>,
  )
  return user
}

const operationsGroup = () => screen.getByRole('group', { name: 'What do you want to practice?' })
const difficultyGroup = () => screen.getByRole('group', { name: 'How hard?' })
const lengthGroup = () => screen.getByRole('group', { name: 'How many questions?' })
const startButton = () => screen.getByRole('button', { name: 'Start Session' })

describe('PracticeSetupPage', () => {
  it('starts with sensible defaults', () => {
    renderSetupPage()

    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked()
    expect(startButton()).toBeEnabled()
  })

  describe('operation selector', () => {
    it('offers all four operations', () => {
      renderSetupPage()

      const names = within(operationsGroup())
        .getAllByRole('checkbox')
        .map((box) => box.getAttribute('value'))
      expect(names).toEqual(['addition', 'subtraction', 'multiplication', 'division'])
    })

    it('allows more than one operation to be selected', async () => {
      const user = renderSetupPage()

      await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }))

      expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked()
    })

    it('has a shortcut to select and clear all operations', async () => {
      const user = renderSetupPage()

      await user.click(screen.getByRole('button', { name: 'Select all' }))
      within(operationsGroup())
        .getAllByRole('checkbox')
        .forEach((box) => expect(box).toBeChecked())

      await user.click(screen.getByRole('button', { name: 'Clear all' }))
      within(operationsGroup())
        .getAllByRole('checkbox')
        .forEach((box) => expect(box).not.toBeChecked())
    })

    it('can be toggled with the keyboard', async () => {
      const user = renderSetupPage()
      const subtraction = screen.getByRole('checkbox', { name: 'Subtraction' })

      subtraction.focus()
      await user.keyboard(' ')

      expect(subtraction).toBeChecked()
    })
  })

  describe('difficulty selector', () => {
    it('offers four levels with descriptions, one selectable at a time', async () => {
      const user = renderSetupPage()
      const radios = within(difficultyGroup()).getAllByRole('radio')

      expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
        'beginner',
        'easy',
        'intermediate',
        'advanced',
      ])
      expect(screen.getByRole('radio', { name: 'Beginner' })).toHaveAccessibleDescription(
        /numbers up to 10/i,
      )

      await user.click(screen.getByRole('radio', { name: 'Advanced' }))

      expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Easy' })).not.toBeChecked()
    })
  })

  describe('session-length selector', () => {
    it('offers 5, 10, 20, and non-stop', () => {
      renderSetupPage()

      const labels = within(lengthGroup())
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value'))
      expect(labels).toEqual(['5', '10', '20', 'continuous'])
    })
  })

  it('disables Start Session and explains why when no operation is selected', async () => {
    const user = renderSetupPage()
    expect(screen.queryByText('Pick at least one operation to start.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }))

    expect(startButton()).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Pick at least one operation to start.')

    await user.click(screen.getByRole('checkbox', { name: 'Division' }))

    expect(startButton()).toBeEnabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('passes the chosen configuration to the practice session', async () => {
    const user = renderSetupPage()

    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    await user.click(screen.getByRole('radio', { name: 'Intermediate' }))
    await user.click(screen.getByRole('radio', { name: 'Non-stop' }))
    await user.click(startButton())

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument()
    const summary = screen.getByText('Operations').closest('dl')
    expect(summary).toHaveTextContent('OperationsAddition, Division')
    expect(summary).toHaveTextContent('DifficultyIntermediate')
    expect(summary).toHaveTextContent('QuestionsNon-stop')
  })
})
