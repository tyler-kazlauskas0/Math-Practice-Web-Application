import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'
import type { SessionSummary } from '../types/statistics'

function renderSummary(state: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: ROUTES.practiceSummary, state }]}>
      <App />
    </MemoryRouter>,
  )
}

const summary: SessionSummary = {
  sessionId: 's1',
  config: { operations: ['addition', 'division'], difficulty: 'easy', sessionLength: 10 },
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
  startedAt: '2026-10-21T10:00:00.000Z',
  completedAt: '2026-10-21T10:05:00.000Z',
}

describe('PracticeSummaryPage', () => {
  it('shows the session totals', () => {
    renderSummary(summary)
    const totals = within(screen.getByText('Questions').closest('dl')!)

    expect(totals.getByText('Questions').nextSibling).toHaveTextContent('10')
    expect(totals.getByText('Right').nextSibling).toHaveTextContent('7')
    expect(totals.getByText('Wrong').nextSibling).toHaveTextContent('3')
    expect(totals.getByText('Score').nextSibling).toHaveTextContent('70%')
  })

  it('breaks results down by operation when more than one was practiced', () => {
    renderSummary(summary)

    const table = screen.getByRole('table', { name: 'By operation' })
    expect(table).toHaveTextContent('Addition5 of 683%2.5s')
    expect(table).toHaveTextContent('Division2 of 450%4.3s')
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
