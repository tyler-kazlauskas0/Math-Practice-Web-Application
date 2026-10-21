import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { appRoutes } from '../routes'
import { ROUTES } from '../data/routes'
import { saveMistakePatterns } from '../services/mistakePatterns'
import { saveAttempt, saveSession } from '../services/practiceHistory'
import { makePattern } from '../test/makePattern'
import { makeQuestion } from '../test/makeQuestion'

function startApp(path: string) {
  const user = userEvent.setup()
  render(<App router={createMemoryRouter(appRoutes, { initialEntries: [path] })} />)
  return user
}

const sevenEights = makePattern(7, 'multiplication', 8, {
  incorrectCount: 4,
  similarCorrectCount: 1,
  lastIncorrectAt: '2026-10-22T15:30:00.000Z',
})
const nineFours = makePattern(9, 'subtraction', 4, { incorrectCount: 2 })
const mastered = makePattern(3, 'addition', 4, {
  incorrectCount: 6,
  similarCorrectCount: 3,
  masteredAt: '2026-10-23T09:00:00.000Z',
})

/** Saves some practice history so the Statistics page isn't empty. */
function seedHistory() {
  const answer = (
    id: string,
    isCorrect: boolean,
    review: boolean,
    operation: 'addition' | 'division',
  ) =>
    saveAttempt({
      sessionId: 's1',
      question: {
        ...(operation === 'division'
          ? makeQuestion(56, 'division', 8)
          : makeQuestion(3, 'addition', 4)),
        id,
        ...(review ? { source: 'mistake-review' as const, mistakePatternId: sevenEights.key } : {}),
      },
      userAnswer: 0,
      isCorrect,
      timeTakenMs: 1000,
      answeredAt: '2026-10-22T10:00:00.000Z',
    })
  answer('a', false, false, 'division')
  answer('b', false, false, 'division')
  answer('c', false, false, 'addition')
  answer('d', true, true, 'division')
  answer('e', false, true, 'division')
  saveSession({
    id: 's1',
    config: { operations: ['division', 'addition'], difficulty: 'easy', sessionLength: 5 },
    isReview: false,
    startedAt: '2026-10-22T10:00:00.000Z',
    completedAt: '2026-10-22T10:05:00.000Z',
    totalAttempts: 5,
    correctAttempts: 1,
  })
}

describe('Statistics: Mistakes section', () => {
  it('shows mistake totals', () => {
    seedHistory()
    saveMistakePatterns([sevenEights, nineFours, mastered])
    startApp(ROUTES.statistics)

    const tiles = within(screen.getByLabelText('Mistake totals'))
    expect(tiles.getByText('Need practice').nextSibling).toHaveTextContent('2')
    expect(tiles.getByText('Mastered').nextSibling).toHaveTextContent('1')
    expect(tiles.getByText('Review questions').nextSibling).toHaveTextContent('2')
    expect(tiles.getByText('Review right').nextSibling).toHaveTextContent('1')
  })

  it('names the most missed operation and lists the most missed facts in order', () => {
    seedHistory()
    saveMistakePatterns([nineFours, sevenEights, mastered])
    startApp(ROUTES.statistics)

    expect(screen.getByText(/most missed operation/i)).toHaveTextContent('Division')
    const facts = within(
      screen.getByRole('heading', { name: 'Most missed facts' }).nextElementSibling as HTMLElement,
    )
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(facts).toEqual([
      '3 + 4 = 7missed 6 times✓ Mastered',
      '7 × 8 = 56missed 4 times',
      '9 − 4 = 5missed 2 times',
    ])
  })

  it('has an empty state when there are no mistakes', () => {
    seedHistory()
    startApp(ROUTES.statistics)

    expect(screen.getByText(/no mistakes so far/i)).toBeInTheDocument()
  })
})

describe('MistakesPage', () => {
  it('lists mistakes that need practice with counts, progress, and last date', () => {
    saveMistakePatterns([nineFours, sevenEights, mastered])
    startApp(ROUTES.mistakes)

    const items = within(screen.getByRole('list', { name: 'Needs practice' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('7 × 8 = 56')
    expect(items[0]).toHaveTextContent('Missed 4 times')
    expect(items[0]).toHaveTextContent('Progress: 1 of 3 right in a row')
    expect(items[0].querySelector('time')).toHaveAttribute('dateTime', '2026-10-22T15:30:00.000Z')
    expect(items[1]).toHaveTextContent('9 − 4 = 5')
  })

  it('shows mastered mistakes separately', async () => {
    saveMistakePatterns([nineFours, sevenEights, mastered])
    const user = startApp(ROUTES.mistakes)
    const masteredButton = screen.getByRole('button', { name: 'Mastered (1)' })
    expect(screen.getByRole('button', { name: 'Needs Practice (2)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(masteredButton)

    expect(masteredButton).toHaveAttribute('aria-pressed', 'true')
    const items = within(screen.getByRole('list', { name: 'Mastered' })).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('3 + 4 = 7')
    expect(items[0]).toHaveTextContent('Mastered on')
  })

  it('has empty states for each view', async () => {
    const user = startApp(ROUTES.mistakes)

    expect(screen.getByText(/nothing needs practice/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mastered (0)' }))
    expect(screen.getByText(/no mastered mistakes yet/i)).toBeInTheDocument()
  })

  it('is reached from Statistics, which stays highlighted in the menu', async () => {
    seedHistory()
    saveMistakePatterns([sevenEights])
    const user = startApp(ROUTES.statistics)

    await user.click(screen.getByRole('link', { name: 'See All Mistakes' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mistakes' })).toBeInTheDocument()
    const nav = within(screen.getByRole('navigation', { name: 'Main' }))
    expect(nav.getByRole('link', { name: 'Statistics' })).toHaveAttribute('aria-current', 'page')
  })
})
