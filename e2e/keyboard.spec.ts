import { expect, test, type Page } from '@playwright/test'
import { keyForCorrectAnswer } from './helpers.ts'

/** Whether the focused control shows a clear focus ring (at least 2px), so sighted keyboard users can follow along. */
const focusIsVisible = (page: Page) =>
  page.evaluate(() => {
    const focused = document.activeElement
    if (!focused || focused === document.body) return false
    // Choice cards hide the real input and draw the ring around the whole card.
    const target = focused.closest('.choice-card') ?? focused
    const style = getComputedStyle(target)
    return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
  })

/** Presses Tab until the control named `name` is focused, checking the focus ring at every step. */
async function tabTo(
  page: Page,
  role: 'button' | 'link' | 'checkbox' | 'radio',
  name: string | RegExp,
) {
  const target = page.getByRole(role, { name, exact: typeof name === 'string' })
  for (let presses = 0; presses < 60; presses++) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
    expect(await focusIsVisible(page), 'focus should always be visible').toBe(true)
  }
  throw new Error(`Couldn't reach ${role} "${name}" with Tab`)
}

test('a whole session works with the keyboard alone, with focus always visible', async ({
  page,
}) => {
  await page.goto('/')

  await tabTo(page, 'link', 'Start Practice')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Practice Setup')

  await tabTo(page, 'checkbox', 'Multiplication')
  await page.keyboard.press('Space')
  await tabTo(page, 'radio', '10 questions')
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('radio', { name: '5 questions' })).toBeChecked()
  await tabTo(page, 'button', 'Start Session')
  await page.keyboard.press('Enter')

  for (let i = 0; i < 5; i++) {
    await page.keyboard.press(await keyForCorrectAnswer(page))
    await tabTo(page, 'button', 'Flip Card')
    await page.keyboard.press('Enter')
    await tabTo(page, 'button', 'I Got It Right')
    await page.keyboard.press('Space')
    await tabTo(page, 'button', /^(Next Question|Finish)$/)
    await page.keyboard.press('Enter')
  }

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Great Practice!')
  await tabTo(page, 'link', 'View Statistics')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Statistics')
})

test('dialogs keep the keyboard user in control', async ({ page }) => {
  await page.goto('/practice/setup')
  await page.getByRole('button', { name: 'Start Session' }).click()
  await page.keyboard.press('1')
  await page.getByRole('button', { name: 'Flip Card' }).click()
  await page.getByRole('button', { name: 'I Got It Right' }).click()

  await tabTo(page, 'button', 'End Session')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Yes, End Session' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'End Session' })).toBeFocused()
})
