import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { appRoutes } from '../routes'
import { ROUTES } from '../data/routes'
import { loadMistakePatterns, saveMistakePatterns } from '../services/mistakePatterns'
import { loadAttempts } from '../services/practiceHistory'
import { loadSettings } from '../services/settingsStorage'
import { makePattern } from '../test/makePattern'
import type { MistakePattern } from '../types/mistake'

type User = ReturnType<typeof userEvent.setup>

function startApp(path: string, state?: unknown) {
  const user = userEvent.setup()
  const view = render(
    <App router={createMemoryRouter(appRoutes, { initialEntries: [{ pathname: path, state }] })} />,
  )
  return { user, ...view }
}

const sevenEights = makePattern(7, 'multiplication', 8)
const nineFours = makePattern(9, 'subtraction', 4)
const modeGroup = () => within(screen.getByRole('group', { name: 'What kind of practice?' }))

/** Picks the correct answer (or a wrong one), flips, marks it honestly, and moves on. */
async function answerHonestly(user: User, getItRight: boolean) {
  const heading = screen.getByRole('heading', { level: 2 }).textContent!
  const [left, symbol, right] = heading.replace(' = ?', '').split(' ')
  const a = Number(left)
  const b = Number(right)
  const correct = { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[symbol]!
  const choices = screen.getAllByRole('button', { name: /^Answer / })
  const valueOf = (choice: HTMLElement) =>
    Number(choice.getAttribute('aria-label')!.replace('Answer ', ''))
  const pick = choices.find((c) => (valueOf(c) === correct) === getItRight)!
  await user.click(pick)
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: getItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  )
  await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
}

describe('practice setup modes', () => {
  it('offers regular practice and mistake review, with the number of mistakes', () => {
    saveMistakePatterns([sevenEights, nineFours])
    startApp(ROUTES.practiceSetup)

    expect(modeGroup().getByRole('radio', { name: 'Regular practice' })).toBeChecked()
    const review = modeGroup().getByRole('radio', { name: 'Mistake review' })
    expect(review).toBeEnabled()
    expect(review).toHaveAccessibleDescription('2 mistakes to review')
  })

  it('disables mistake review and explains why when there are no active mistakes', () => {
    saveMistakePatterns([{ ...sevenEights, masteredAt: '2026-10-22T10:00:00.000Z' }])
    startApp(ROUTES.practiceSetup)

    const review = modeGroup().getByRole('radio', { name: 'Mistake review' })
    expect(review).toBeDisabled()
    expect(review).toHaveAccessibleDescription(/no mistakes to review/i)
  })

  it('hides operation and difficulty choices in mistake review', async () => {
    saveMistakePatterns([sevenEights])
    const { user } = startApp(ROUTES.practiceSetup)

    await user.click(modeGroup().getByRole('radio', { name: 'Mistake review' }))

    expect(screen.queryByRole('group', { name: 'What do you want to practice?' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'How hard?' })).toBeNull()
    expect(screen.getByText(/questions like the ones you missed/i)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'How many questions?' })).toBeInTheDocument()
  })
})

describe('mistake review sessions', () => {
  async function startReview(patterns: MistakePattern[], length = '10 questions') {
    saveMistakePatterns(patterns)
    const result = startApp(ROUTES.practiceSetup)
    await result.user.click(modeGroup().getByRole('radio', { name: 'Mistake review' }))
    await result.user.click(screen.getByRole('radio', { name: length }))
    await result.user.click(screen.getByRole('button', { name: 'Start Session' }))
    return result
  }

  it('asks related questions from several mistakes and records which one each came from', async () => {
    const { user } = await startReview([sevenEights, nineFours])
    expect(screen.getByRole('heading', { level: 1, name: 'Mistake Review' })).toBeInTheDocument()

    await answerHonestly(user, true)
    await answerHonestly(user, true)

    const attempts = loadAttempts()
    expect(attempts.map((a) => a.question.source)).toEqual(['mistake-review', 'mistake-review'])
    expect(new Set(attempts.map((a) => a.question.mistakePatternId))).toEqual(
      new Set([sevenEights.key, nineFours.key]),
    )
    attempts.forEach((a) => {
      expect(a.question.displayText).not.toBe('7 × 8')
      expect(a.question.displayText).not.toBe('9 − 4')
    })
  })

  it('counts correct review answers toward mastery and saves the pattern', async () => {
    const { user } = await startReview([sevenEights])

    await answerHonestly(user, true)

    expect(loadMistakePatterns()[0]).toMatchObject({ similarCorrectCount: 1, masteredAt: null })
  })

  it('resets progress and counts a mistake on the original after a wrong review answer', async () => {
    const { user } = await startReview([{ ...sevenEights, similarCorrectCount: 2 }])

    await answerHonestly(user, false)

    expect(loadMistakePatterns()).toEqual([
      expect.objectContaining({ key: sevenEights.key, incorrectCount: 2, similarCorrectCount: 0 }),
    ])
  })

  it('masters mistakes after three correct answers, ends when all are mastered, and shows counts', async () => {
    const { user } = await startReview([sevenEights, nineFours])

    for (let i = 0; i < 6; i++) await answerHonestly(user, true)

    expect(loadMistakePatterns().every((p) => p.masteredAt !== null)).toBe(true)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Mistake Review Done!' }),
    ).toBeInTheDocument()
    const review = within(screen.getByRole('region', { name: 'Mistake review' }))
    expect(review.getByText('Review questions').nextSibling).toHaveTextContent('6')
    expect(review.getByText('Right').nextSibling).toHaveTextContent('6')
    expect(review.getByText('Mistakes practiced').nextSibling).toHaveTextContent('2')
    expect(review.getByText('Mastered').nextSibling).toHaveTextContent('2')
    expect(screen.getByText(/you mastered 2 mistakes/i)).toBeInTheDocument()
  })

  it('leaves mastered mistakes out of the next review', async () => {
    const mastered = { ...sevenEights, masteredAt: '2026-10-22T10:00:00.000Z' }
    const { user } = await startReview([mastered, nineFours], '5 questions')

    for (let i = 0; i < 2; i++) await answerHonestly(user, true)

    expect(loadAttempts().every((a) => a.question.mistakePatternId === nineFours.key)).toBe(true)
  })

  it('goes back to setup if there is nothing left to review', () => {
    saveMistakePatterns([{ ...sevenEights, masteredAt: '2026-10-22T10:00:00.000Z' }])
    startApp(ROUTES.practiceSession, {
      operations: ['multiplication'],
      difficulty: 'easy',
      sessionLength: 5,
      mode: 'mistake-review',
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()
  })
})

describe('mastery threshold setting', () => {
  it('can be changed in Settings and is used for mastery', async () => {
    const settings = startApp(ROUTES.settings)
    const group = within(screen.getByRole('group', { name: 'Correct answers to master a mistake' }))
    expect(group.getByRole('radio', { name: '3 in a row' })).toBeChecked()
    await settings.user.click(group.getByRole('radio', { name: '2 in a row' }))
    expect(loadSettings().masteryThreshold).toBe(2)
    settings.unmount()

    const { user } = await (async () => {
      saveMistakePatterns([sevenEights])
      const result = startApp(ROUTES.practiceSetup)
      await result.user.click(modeGroup().getByRole('radio', { name: 'Mistake review' }))
      await result.user.click(screen.getByRole('button', { name: 'Start Session' }))
      return result
    })()
    await answerHonestly(user, true)
    await answerHonestly(user, true)

    expect(loadMistakePatterns()[0].masteredAt).not.toBeNull()
  })
})
