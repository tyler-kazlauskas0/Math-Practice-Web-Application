import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadMistakePatterns } from '../services/mistakePatterns'
import { loadAttempts, loadRecentSessions } from '../services/practiceHistory'
import { loadSettings } from '../services/settingsStorage'
import { fitsDifficulty } from '../utils/questions/difficultyCheck'
import { answerQuestion, currentQuestion, openApp, valueNextTo, type User } from '../test/practice'

/**
 * Whole journeys through the app, the way a child would use it: starting from the home
 * page and using only what is on screen. Nothing is set up behind the scenes.
 */

const nav = () => within(screen.getByRole('navigation', { name: 'Main' }))
const heading = (name: string | RegExp) => screen.getByRole('heading', { level: 1, name })

/** From the home page, picks the given choices on the setup page and starts. */
async function startPractice(
  user: User,
  { operations, level, length }: { operations: string[]; level: string; length: string },
) {
  await user.click(screen.getByRole('link', { name: 'Start Practice' }))
  const operationGroup = within(
    screen.getByRole('group', { name: 'What do you want to practice?' }),
  )
  for (const checkbox of operationGroup.getAllByRole('checkbox')) {
    const wanted = operations.includes(checkbox.getAttribute('value')!)
    if ((checkbox as HTMLInputElement).checked !== wanted) await user.click(checkbox)
  }
  await user.click(screen.getByRole('radio', { name: level }))
  await user.click(screen.getByRole('radio', { name: length }))
  await user.click(screen.getByRole('button', { name: 'Start Session' }))
}

/** Answers right, then wrong, following the pattern, e.g. [true, false, true]. */
async function answerAll(user: User, results: boolean[]) {
  for (const right of results) await answerQuestion(user, right)
}

async function makeOneMistake(user: User) {
  await startPractice(user, {
    operations: ['multiplication'],
    level: 'Easy',
    length: '5 questions',
  })
  const missed = currentQuestion()
  await answerAll(user, [false, true, true, true, true])
  return missed
}

describe('a full addition session', () => {
  it('goes from home to the summary and into statistics, adding up correctly', async () => {
    const { user } = openApp('/')
    await startPractice(user, { operations: ['addition'], level: 'Easy', length: '5 questions' })

    expect(heading('Practice')).toBeInTheDocument()
    const results = [true, true, false, true, false]
    for (const [index, right] of results.entries()) {
      expect(screen.getByText(`Question ${index + 1} of 5`)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index))
      expect(currentQuestion().symbol).toBe('+')
      await answerQuestion(user, right)
    }

    expect(heading('Great Practice!')).toBeInTheDocument()
    const summary = screen.getByRole('main')
    expect(valueNextTo(summary, 'Questions')).toBe('5')
    expect(valueNextTo(summary, 'Right')).toBe('3')
    expect(valueNextTo(summary, 'Wrong')).toBe('2')
    expect(valueNextTo(summary, 'Accuracy')).toBe('60%')
    expect(summary).toHaveTextContent('You practiced Addition at the Easy level.')

    const attempts = loadAttempts()
    expect(attempts).toHaveLength(5)
    attempts.forEach(({ question }) => {
      expect(question.operation).toBe('addition')
      expect(fitsDifficulty(question, 'easy')).toBe(true)
    })

    await user.click(screen.getByRole('link', { name: 'View Statistics' }))
    expect(valueNextTo(screen.getByLabelText('Overall results'), 'Accuracy')).toBe('60%')
    const addition = screen.getByRole('article', { name: 'Addition' })
    expect(valueNextTo(addition, 'Attempted')).toBe('5')
    expect(screen.getByRole('article', { name: 'Subtraction' })).toHaveTextContent(
      'Not practiced yet',
    )
  })
})

describe('a mixed-operation session', () => {
  it('only asks the chosen operations, mixes them, and breaks the results down', async () => {
    const { user } = openApp('/')
    const chosen = ['subtraction', 'multiplication', 'division']
    await startPractice(user, { operations: chosen, level: 'Beginner', length: '20 questions' })

    const symbols = new Set<string>()
    for (let i = 0; i < 20; i++) {
      symbols.add(currentQuestion().symbol)
      await answerQuestion(user, i % 4 !== 0)
    }

    expect(symbols.has('+')).toBe(false)
    // The chance of 20 random picks all being the same operation is about 1 in 10⁹.
    expect(symbols.size).toBeGreaterThan(1)
    const asked = new Set(loadAttempts().map((a) => a.question.operation))
    asked.forEach((operation) => expect(chosen).toContain(operation))

    const rows = within(screen.getByRole('table')).getAllByRole('rowheader')
    expect(rows.map((row) => row.textContent?.toLowerCase()).sort()).toEqual([...asked].sort())
    expect(valueNextTo(screen.getByRole('main'), 'Right')).toBe('15')
  })
})

describe('continuous practice', () => {
  it('keeps going past the longest fixed session until the player ends it', async () => {
    const { user } = openApp('/')
    await startPractice(user, { operations: ['addition'], level: 'Easy', length: 'Non-stop' })

    for (let i = 0; i < 21; i++) await answerQuestion(user, true)

    expect(screen.getByText('Question 22')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('21 questions answered · 21 right')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))

    expect(heading('Great Practice!')).toBeInTheDocument()
    expect(valueNextTo(screen.getByRole('main'), 'Questions')).toBe('21')
    expect(loadRecentSessions()[0]).toMatchObject({
      totalAttempts: 21,
      completedAt: expect.any(String),
    })
  })
})

describe('mistakes', () => {
  it('an answer marked wrong becomes a mistake to review, shown in statistics', async () => {
    const { user } = openApp('/')
    const missed = await makeOneMistake(user)

    expect(loadMistakePatterns()).toEqual([
      expect.objectContaining({ operation: 'multiplication', correctAnswer: missed.answer }),
    ])
    expect(valueNextTo(screen.getByRole('main'), 'To review')).toBe('1')

    await user.click(nav().getByRole('link', { name: 'Statistics' }))
    expect(valueNextTo(screen.getByLabelText('Mistake totals'), 'Need practice')).toBe('1')
    await user.click(screen.getByRole('link', { name: 'See All Mistakes' }))
    const list = screen.getByRole('list', { name: 'Needs practice' })
    expect(list).toHaveTextContent(`${missed.text} = ${missed.answer}`)
  })

  it('mistake review asks related questions, and three right in a row masters it', async () => {
    const { user } = openApp('/')
    const missed = await makeOneMistake(user)

    await user.click(nav().getByRole('link', { name: 'Practice' }))
    const review = screen.getByRole('radio', { name: 'Mistake review' })
    expect(review).toHaveAccessibleDescription('1 mistake to review')
    await user.click(review)
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    expect(heading('Mistake Review')).toBeInTheDocument()
    for (let i = 0; i < 3; i++) {
      const question = currentQuestion()
      // Related: the same times table, or its fact family (7 × 8 → 56 ÷ 8).
      expect(['×', '÷']).toContain(question.symbol)
      expect(question.text).not.toBe(missed.text)
      await answerQuestion(user, true)
    }

    // Mastering the only mistake ends the review early.
    expect(heading('Mistake Review Done!')).toBeInTheDocument()
    expect(screen.getByText(/you mastered 1 mistake/i)).toBeInTheDocument()
    expect(loadMistakePatterns()[0].masteredAt).not.toBeNull()
    expect(
      loadAttempts()
        .slice(-3)
        .every((a) => a.question.source === 'mistake-review'),
    ).toBe(true)

    await user.click(nav().getByRole('link', { name: 'Practice' }))
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeDisabled()
  })
})

describe('a browser refresh', () => {
  it('keeps the session in progress, and everything once it is finished', async () => {
    const first = openApp('/')
    await startPractice(first.user, {
      operations: ['addition'],
      level: 'Easy',
      length: '5 questions',
    })
    await answerAll(first.user, [true, false])
    const shown = currentQuestion().text
    const sessionUrl = first.router.state.location
    first.unmount()

    // Refresh: the same page in the same tab, rebuilt from saved data.
    const second = openApp(sessionUrl.pathname, { state: sessionUrl.state, key: sessionUrl.key })
    expect(screen.getByText('Question 3 of 5')).toBeInTheDocument()
    expect(currentQuestion().text).toBe(shown)
    await answerAll(second.user, [true, true, true])
    expect(heading('Great Practice!')).toBeInTheDocument()
    second.unmount()

    openApp('/statistics')
    const overall = screen.getByLabelText('Overall results')
    expect(valueNextTo(overall, 'Questions')).toBe('5')
    expect(valueNextTo(overall, 'Right')).toBe('4')
    expect(loadMistakePatterns()).toHaveLength(1)
  })
})

describe('resetting statistics', () => {
  it('clears practice history but keeps settings and mistakes to review', async () => {
    const { user } = openApp('/settings')
    await user.click(screen.getByRole('checkbox', { name: 'Card flip animation' }))
    await user.click(nav().getByRole('link', { name: 'Home' }))
    await makeOneMistake(user)

    await user.click(nav().getByRole('link', { name: 'Statistics' }))
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(screen.getByRole('checkbox', { name: /I understand/ }))
    await user.click(screen.getByRole('button', { name: 'Delete Everything' }))

    expect(screen.getByRole('status')).toHaveTextContent('Your practice history was deleted.')
    expect(screen.getByText(/no practice yet/i)).toBeInTheDocument()
    expect(loadAttempts()).toEqual([])
    expect(loadRecentSessions()).toEqual([])
    expect(loadSettings().animationsEnabled).toBe(false)
    expect(loadMistakePatterns()).toHaveLength(1)
  })
})
