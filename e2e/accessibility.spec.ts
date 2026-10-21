import { expect, test } from '@playwright/test'
import { expectNoAxeViolations, keyForCorrectAnswer, PAGES, seedPracticeData } from './helpers.ts'

test.describe('automated accessibility checks (axe, in a real browser)', () => {
  for (const [name, path] of PAGES) {
    test(`the ${name} page, empty and with practice data`, async ({ page }) => {
      await page.goto(path)
      await expectNoAxeViolations(page)

      await seedPracticeData(page)
      await page.goto(path)
      await expectNoAxeViolations(page)
    })
  }

  test('a practice session: card front, back, marked, feedback, and summary', async ({ page }) => {
    await page.goto('/practice/setup')
    await page.getByRole('radio', { name: '5 questions' }).check()
    await page.getByRole('button', { name: 'Start Session' }).click()
    await expectNoAxeViolations(page)

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press(await keyForCorrectAnswer(page))
      await page.getByRole('button', { name: 'Flip Card' }).click()
      if (i === 0) await expectNoAxeViolations(page)
      await page.getByRole('button', { name: 'I Got It Right' }).click()
      if (i === 0) await expectNoAxeViolations(page)
      await page.getByRole('button', { name: /^(Next Question|Finish)$/ }).click()
    }

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Great Practice!')
    await expectNoAxeViolations(page)
  })

  test('the confirmation dialogs', async ({ page }) => {
    await seedPracticeData(page)
    await page.goto('/statistics')
    await page.getByRole('button', { name: 'Reset Statistics' }).click()
    await expectNoAxeViolations(page)

    await page.goto('/settings')
    await page.getByRole('button', { name: 'Clear All Application Data' }).click()
    await expectNoAxeViolations(page)
  })
})
