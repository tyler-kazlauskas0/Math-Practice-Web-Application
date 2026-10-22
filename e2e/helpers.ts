import { createRequire } from 'node:module'
import { expect, type Page } from '@playwright/test'

const axeSource = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

/** Every page, plus the data each needs to show everything (not just its empty state). */
export const PAGES = [
  ['home', './'],
  ['practice setup', './practice/setup'],
  ['statistics', './statistics'],
  ['mistakes', './statistics/mistakes'],
  ['settings', './settings'],
  ['not found', './nope'],
] as const

/** Saves a little practice history and one mistake, as if the app had been used. */
export async function seedPracticeData(page: Page) {
  await page.goto('./')
  await page.evaluate(() => {
    const at = '2026-10-21T10:00:00.000Z'
    const question = {
      id: 'q1',
      operation: 'multiplication',
      difficulty: 'easy',
      leftOperand: 7,
      rightOperand: 8,
      correctAnswer: 56,
      displayText: '7 × 8',
    }
    const set = (key: string, value: unknown) =>
      localStorage.setItem(`math-practice:${key}`, JSON.stringify(value))
    set('schema-version', 3)
    set('sessions', [
      {
        id: 's1',
        config: { operations: ['multiplication'], difficulty: 'easy', sessionLength: 5 },
        isReview: false,
        startedAt: at,
        completedAt: at,
        totalAttempts: 1,
        correctAttempts: 0,
      },
    ])
    set('attempts', [
      {
        sessionId: 's1',
        question,
        userAnswer: 54,
        isCorrect: false,
        timeTakenMs: 1000,
        answeredAt: at,
      },
    ])
    set('mistake-patterns', [
      {
        key: 'multiplication:7:8',
        operation: 'multiplication',
        leftOperand: 7,
        rightOperand: 8,
        correctAnswer: 56,
        difficulty: 'easy',
        incorrectCount: 1,
        similarCorrectCount: 0,
        incorrectAnswers: [54],
        firstIncorrectAt: at,
        lastIncorrectAt: at,
        masteredAt: null,
      },
    ])
  })
}

/** Runs axe, including color contrast, which only a real browser can check. */
export async function expectNoAxeViolations(page: Page) {
  // Let fade-ins finish first: text that is still fading in would fail the contrast check.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)))
  await page.addScriptTag({ path: axeSource })
  const violations = await page.evaluate(async () => {
    // @ts-expect-error axe is added to the page by the script tag above.
    const results = await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    })
    return results.violations.map(
      (v: { id: string; nodes: { target: string[] }[] }) =>
        `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    )
  })
  expect(violations).toEqual([])
}

/** Fails if the page scrolls sideways, which means something doesn't fit. */
export async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/** The answer to the question on the card, worked out from its text, e.g. "7 × 8" → 56. */
export async function correctAnswer(page: Page) {
  const text = (await page.getByRole('heading', { level: 2 }).textContent())!.replace(' = ?', '')
  const [a, symbol, b] = text.split(' ')
  const [left, right] = [Number(a), Number(b)]
  return { '+': left + right, '−': left - right, '×': left * right, '÷': left / right }[symbol]!
}

/** Which number key (1–4) picks the correct answer. */
export async function keyForCorrectAnswer(page: Page) {
  const answer = await correctAnswer(page)
  // Each button ends with its number, after the hidden shortcut key and "Answer " label.
  const values = await page
    .getByRole('button', { name: /^Answer / })
    .evaluateAll((buttons) => buttons.map((b) => Number(b.lastChild?.textContent)))
  return String(values.indexOf(answer) + 1)
}

/** Every address in the app, with the main heading it should show when opened directly. */
export const ROUTES_TO_VERIFY = [
  ['./', /Welcome to Math Practice/],
  ['./practice/setup', 'Practice Setup'],
  // Without a session to run or show, these send the player somewhere sensible.
  ['./practice/session', 'Practice Setup'],
  ['./practice/summary', 'Practice Summary'],
  ['./statistics', 'Statistics'],
  ['./statistics/mistakes', 'Mistakes'],
  ['./settings', 'Settings'],
  ['./no-such-page', 'Page not found'],
] as const

/** Answers every question in a session of `length`, marking each one right. */
export async function playSession(
  page: Page,
  length: '5 questions' | '10 questions' = '5 questions',
) {
  await page.goto('./practice/setup')
  await page.getByRole('radio', { name: length }).check()
  await page.getByRole('button', { name: 'Start Session' }).click()
  const count = Number(length.split(' ')[0])
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(await keyForCorrectAnswer(page))
    await page.getByRole('button', { name: 'Flip Card' }).click()
    await page.getByRole('button', { name: 'I Got It Right' }).click()
    await page.getByRole('button', { name: /^(Next Question|Finish)$/ }).click()
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Great Practice!')
}
