import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'
import { makeQuestion } from '../test/makeQuestion'
import type { SessionSummary } from '../types/statistics'

function renderSummary(state: unknown) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[{ pathname: ROUTES.practiceSummary, state }]}>
      <App />
    </MemoryRouter>,
  )
  return user
}

const summary: SessionSummary = {
  sessionId: 's1',
  config: { operations: ['addition', 'division'], difficulty: 'intermediate', sessionLength: 10 },
  totalAttempts: 10,
  correctAttempts: 7,
  incorrectAttempts: 3,
  accuracy: 0.7,
  averageTimeMs: 3200,
  byOperation: [
    {
      operation: 'addition',
      totalAttempts: 6,
      correctAttempts: 5,
      accuracy: 5 / 6,
      averageTimeMs: 2500,
    },
    {
      operation: 'division',
      totalAttempts: 4,
      correctAttempts: 2,
      accuracy: 0.5,
      averageTimeMs: 4250,
    },
  ],
  mistakes: [makeQuestion(56, 'division', 7), makeQuestion(27, 'addition', 15)],
  isReview: false,
  startedAt: '2026-10-21T10:00:00.000Z',
  completedAt: '2026-10-21T10:05:00.000Z',
}

const totals = () => within(screen.getByText('Questions').closest('dl')!)
const total = (label: string) => totals().getByText(label).nextSibling

describe('PracticeSummaryPage', () => {
  it('shows attempted, right, wrong, accuracy, and questions to review', () => {
    renderSummary(summary)

    expect(total('Questions')).toHaveTextContent('10')
    expect(total('Right')).toHaveTextContent('7')
    expect(total('Wrong')).toHaveTextContent('3')
    expect(total('Accuracy')).toHaveTextContent('70%')
    expect(total('To review')).toHaveTextContent('2')
  })

  it('names the operations practiced and the difficulty level', () => {
    renderSummary(summary)

    expect(screen.getByText(/you practiced/i)).toHaveTextContent(
      'You practiced Addition and Division at the Intermediate level.',
    )
  })

  it('breaks results down by operation when more than one was practiced', () => {
    renderSummary(summary)

    const table = screen.getByRole('table', { name: 'By operation' })
    expect(table).toHaveTextContent('Addition5 of 683%2.5s')
    expect(table).toHaveTextContent('Division2 of 450%4.3s')
  })

  it('has all five actions', () => {
    renderSummary(summary)

    expect(screen.getByRole('link', { name: 'Practice Again' })).toHaveAttribute(
      'href',
      ROUTES.practiceSession,
    )
    expect(screen.getByRole('link', { name: 'Practice Mistakes (2)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Change Settings' })).toHaveAttribute(
      'href',
      ROUTES.practiceSetup,
    )
    expect(screen.getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
      'href',
      ROUTES.statistics,
    )
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', ROUTES.home)
  })

  it('Practice Again starts a new session with the same choices', async () => {
    const user = renderSummary(summary)

    await user.click(screen.getByRole('link', { name: 'Practice Again' }))

    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/[+÷]/)
  })

  it('Practice Mistakes asks only the questions that were marked wrong', async () => {
    const user = renderSummary(summary)

    await user.click(screen.getByRole('link', { name: 'Practice Mistakes (2)' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mistake Review' })).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('56 ÷ 7 = ?')
  })

  it('Change Settings opens setup with this session’s choices already picked', async () => {
    const user = renderSummary(summary)

    await user.click(screen.getByRole('link', { name: 'Change Settings' }))

    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked()
  })

  it('disables Practice Mistakes and says why when there were none', () => {
    renderSummary({ ...summary, mistakes: [], incorrectAttempts: 0 })

    const button = screen.getByRole('button', { name: 'Practice Mistakes' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('No mistakes to practice. Great job!')
  })

  it('has its own heading after a mistake review', () => {
    renderSummary({ ...summary, isReview: true })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Mistake Review Done!' }),
    ).toBeInTheDocument()
  })

  it('explains when there is no session to show', () => {
    renderSummary(undefined)

    expect(screen.getByText(/no finished session/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Practicing' })).toHaveAttribute(
      'href',
      ROUTES.practiceSetup,
    )
  })
})
