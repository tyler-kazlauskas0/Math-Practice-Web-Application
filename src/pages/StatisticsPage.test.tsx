import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { appRoutes } from '../routes'
import { ROUTES } from '../data/routes'
import { saveAttempt, saveSession, type StoredSession } from '../services/practiceHistory'
import { makeQuestion } from '../test/makeQuestion'
import type { DifficultyLevel, Question } from '../types/question'

function renderStatistics() {
  const user = userEvent.setup()
  render(<App router={createMemoryRouter(appRoutes, { initialEntries: [ROUTES.statistics] })} />)
  return user
}

/** Saves a session with the given answers (true = right). */
function seedSession(
  id: string,
  startedAt: string,
  question: Question,
  difficulty: DifficultyLevel,
  answers: boolean[],
  overrides: Partial<StoredSession> = {},
) {
  answers.forEach((isCorrect, i) =>
    saveAttempt({
      sessionId: id,
      question: { ...question, id: `${id}-q${i}`, difficulty },
      userAnswer: 0,
      isCorrect,
      timeTakenMs: 2000,
      answeredAt: startedAt,
    }),
  )
  saveSession({
    id,
    config: { operations: [question.operation], difficulty, sessionLength: 5 },
    isReview: false,
    startedAt,
    completedAt: startedAt,
    totalAttempts: answers.length,
    correctAttempts: answers.filter(Boolean).length,
    ...overrides,
  })
}

function seedHistory() {
  seedSession('older', '2026-10-20T09:00:00.000Z', makeQuestion(2, 'addition', 3), 'beginner', [
    true,
    true,
    false,
    true,
  ])
  seedSession(
    'newer',
    '2026-10-21T15:30:00.000Z',
    makeQuestion(56, 'division', 7),
    'advanced',
    [true, false],
    { completedAt: null },
  )
}

const card = (name: string) => screen.getByRole('article', { name })
const count = (container: HTMLElement, label: string) =>
  within(container).getByText(label).nextSibling?.textContent

describe('StatisticsPage', () => {
  it('shows an empty state for new players', () => {
    renderStatistics()

    expect(screen.getByText(/no practice yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Practicing' })).toHaveAttribute(
      'href',
      ROUTES.practiceSetup,
    )
    expect(screen.queryByRole('button', { name: 'Reset Statistics' })).not.toBeInTheDocument()
  })

  it('shows overall totals and accuracy', () => {
    seedHistory()
    renderStatistics()

    const tiles = within(screen.getByLabelText('Overall results'))
    expect(tiles.getByText('Questions').nextSibling).toHaveTextContent('6')
    expect(tiles.getByText('Right').nextSibling).toHaveTextContent('4')
    expect(tiles.getByText('Wrong').nextSibling).toHaveTextContent('2')
    expect(tiles.getByText('Accuracy').nextSibling).toHaveTextContent('67%')
    expect(screen.getByText(/2 sessions · Best streak: 2 right in a row/)).toBeInTheDocument()
  })

  it('has a card for every operation', () => {
    seedHistory()
    renderStatistics()

    const addition = card('Addition')
    expect(count(addition, 'Attempted')).toBe('4')
    expect(count(addition, 'Right')).toBe('3')
    expect(count(addition, 'Wrong')).toBe('1')
    expect(addition).toHaveTextContent('75% accuracy')
    expect(card('Division')).toHaveTextContent('50% accuracy')
    expect(card('Subtraction')).toHaveTextContent('Not practiced yet')
    expect(card('Multiplication')).toHaveTextContent('Not practiced yet')
  })

  it('has a clearly labelled card for every level', () => {
    seedHistory()
    renderStatistics()

    expect(card('Level 1: Beginner')).toHaveTextContent('75% accuracy')
    expect(count(card('Level 1: Beginner'), 'Attempted')).toBe('4')
    expect(card('Level 2: Easy')).toHaveTextContent('Not practiced yet')
    expect(card('Level 3: Intermediate')).toHaveTextContent('Not practiced yet')
    expect(card('Level 4: Advanced')).toHaveTextContent('50% accuracy')
  })

  it('lists recent sessions newest first with their details', () => {
    seedHistory()
    renderStatistics()

    const rows = within(
      screen.getByRole('heading', { name: 'Recent sessions' }).parentElement!,
    ).getAllByRole('listitem')
    expect(rows).toHaveLength(2)

    const [newest, oldest] = rows
    expect(newest.querySelector('time')).toHaveAttribute('dateTime', '2026-10-21T15:30:00.000Z')
    expect(newest).toHaveTextContent('Division · Advanced')
    expect(newest).toHaveTextContent('Not finished')
    expect(count(newest, 'Attempted')).toBe('2')
    expect(count(newest, 'Accuracy')).toBe('50%')

    expect(oldest).toHaveTextContent('Addition · Beginner')
    expect(count(oldest, 'Right')).toBe('3')
    expect(count(oldest, 'Wrong')).toBe('1')
    expect(count(oldest, 'Accuracy')).toBe('75%')
  })
})

describe('Reset Statistics', () => {
  it('needs the "I understand" box ticked before deleting', async () => {
    seedHistory()
    const user = renderStatistics()

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))

    const dialog = screen.getByRole('alertdialog', { name: 'Delete all practice history?' })
    const understood = within(dialog).getByRole('checkbox')
    expect(understood).toHaveFocus()
    expect(within(dialog).getByRole('button', { name: 'Delete Everything' })).toBeDisabled()

    await user.click(understood)
    expect(within(dialog).getByRole('button', { name: 'Delete Everything' })).toBeEnabled()
  })

  it('can be cancelled without deleting anything', async () => {
    seedHistory()
    const user = renderStatistics()

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset Statistics' })).toHaveFocus()
    expect(within(screen.getByLabelText('Overall results')).getByText('6')).toBeInTheDocument()
  })

  it('deletes everything, keeps settings, and refreshes the page', async () => {
    localStorage.setItem('math-practice:settings', '{"animationsEnabled":false}')
    seedHistory()
    const user = renderStatistics()

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Delete Everything' }))

    expect(screen.getByRole('status')).toHaveTextContent('Your practice history was deleted.')
    expect(screen.getByText(/no practice yet/i)).toBeInTheDocument()
    expect(localStorage.getItem('math-practice:sessions')).toBeNull()
    expect(localStorage.getItem('math-practice:attempts')).toBeNull()
    expect(JSON.parse(localStorage.getItem('math-practice:settings')!)).toMatchObject({
      animationsEnabled: false,
    })
  })
})
