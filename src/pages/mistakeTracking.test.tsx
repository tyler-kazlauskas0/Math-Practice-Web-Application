import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { ROUTES } from '../data/routes'
import { loadMistakePatterns } from '../services/mistakePatterns'
import { makeQuestion } from '../test/makeQuestion'
import type { PracticeSessionRequest } from '../types/session'

function startApp(path: string, state?: unknown) {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <App />
    </MemoryRouter>,
  )
  return { user, ...view }
}

async function answer(user: ReturnType<typeof userEvent.setup>, markRight: boolean) {
  await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: markRight ? 'I Got It Right' : 'I Got It Wrong' }),
  )
  await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
}

// Asks 7 × 8 twice, as a mistake review does.
const sevenEights: PracticeSessionRequest = {
  operations: ['multiplication'],
  difficulty: 'easy',
  sessionLength: 5,
  reviewQuestions: [makeQuestion(7, 'multiplication', 8), makeQuestion(7, 'multiplication', 8)],
}

describe('mistake tracking', () => {
  it('creates a pattern when an answer is marked wrong', async () => {
    const { user } = startApp(ROUTES.practiceSession, sevenEights)

    await answer(user, false)

    expect(loadMistakePatterns()).toEqual([
      expect.objectContaining({
        key: 'multiplication:7:8',
        correctAnswer: 56,
        difficulty: 'easy',
        incorrectCount: 1,
        similarCorrectCount: 0,
      }),
    ])
  })

  it('does not create a pattern for a right answer', async () => {
    const { user } = startApp(ROUTES.practiceSession, sevenEights)

    await answer(user, true)

    expect(loadMistakePatterns()).toEqual([])
  })

  it('updates the same pattern when the fact is missed again, without duplicates', async () => {
    const { user } = startApp(ROUTES.practiceSession, sevenEights)

    await answer(user, false)
    await answer(user, false)

    const patterns = loadMistakePatterns()
    expect(patterns).toHaveLength(1)
    expect(patterns[0].incorrectCount).toBe(2)
  })

  it('keeps patterns after a restart and adds to them', async () => {
    const first = startApp(ROUTES.practiceSession, sevenEights)
    await answer(first.user, false)
    first.unmount()

    const second = startApp(ROUTES.practiceSession, sevenEights)
    await answer(second.user, false)

    expect(loadMistakePatterns()[0].incorrectCount).toBe(2)
  })

  it('removes patterns when all app data is cleared', async () => {
    const session = startApp(ROUTES.practiceSession, sevenEights)
    await answer(session.user, false)
    session.unmount()

    const { user } = startApp(ROUTES.settings)
    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
    await user.type(screen.getByRole('textbox', { name: 'Type DELETE to confirm' }), 'DELETE')
    await user.click(screen.getByRole('button', { name: 'Delete Everything' }))

    expect(localStorage.getItem('math-practice:mistake-patterns')).toBeNull()
    expect(loadMistakePatterns()).toEqual([])
  })
})
