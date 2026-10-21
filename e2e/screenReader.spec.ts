import { expect, test } from '@playwright/test'
import { correctAnswer, keyForCorrectAnswer } from './helpers.ts'

/**
 * Checks what a screen reader gets from the browser's accessibility tree: names, roles, and
 * announcements. This can't replace listening with a real screen reader (see docs/TESTING.md),
 * but catches anything missing or unlabelled.
 */

test('the question card makes sense without seeing it', async ({ page }) => {
  await page.goto('/practice/setup')
  await page.getByRole('checkbox', { name: 'Addition' }).uncheck()
  await page.getByRole('checkbox', { name: 'Multiplication' }).check()
  await page.getByRole('radio', { name: '5 questions' }).check()
  await page.getByRole('button', { name: 'Start Session' }).click()

  const question = page.getByRole('heading', { level: 2 })
  await expect(question).toHaveAccessibleName(/^What is \d+ times \d+\?$/)
  await expect(page.getByRole('progressbar', { name: 'Session progress' })).toHaveAttribute(
    'aria-valuetext',
    '0 of 5 questions answered',
  )
  const answers = page.getByRole('button', { name: /^Answer \d+$/ })
  await expect(answers).toHaveCount(4)
  await expect(answers.first()).toHaveAttribute('aria-keyshortcuts', '1')

  const answer = await correctAnswer(page)
  await page.keyboard.press(await keyForCorrectAnswer(page))
  await expect(page.getByRole('button', { name: `Answer ${answer}` })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Flip Card' }).click()
  await expect(page.getByRole('status').filter({ hasText: /answer is/i })).toContainText(
    String(answer),
  )

  await page.getByRole('button', { name: 'I Got It Right' }).click()
  await expect(page.getByRole('status').filter({ hasText: /1 of 5/ })).toBeAttached()
})

test('every page has one main heading, a main landmark, and a labelled menu', async ({ page }) => {
  for (const path of ['/', '/practice/setup', '/statistics', '/statistics/mistakes', '/settings']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(await page.title()).not.toBe('')
  }
})

test('the accessibility tree of the setup page reads in a sensible order', async ({ page }) => {
  await page.goto('/practice/setup')

  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - heading "Practice Setup" [level=1]
    - group "What kind of practice?":
      - radio "Regular practice" [checked]
      - radio "Mistake review" [disabled]
    - group "What do you want to practice?":
      - checkbox "Addition" [checked]
      - checkbox "Subtraction"
      - checkbox "Multiplication"
      - checkbox "Division"
      - button "Select all"
    - group "How hard?":
      - radio "Beginner"
      - radio "Easy" [checked]
      - radio "Intermediate"
      - radio "Advanced"
    - group "How many questions?":
      - radio "5 questions"
      - radio "10 questions" [checked]
      - radio "20 questions"
      - radio "Non-stop"
    - button "Start Session"
  `)
})
