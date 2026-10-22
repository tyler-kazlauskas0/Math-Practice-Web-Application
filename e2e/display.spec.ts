import { expect, test, type Page } from '@playwright/test'
import { expectNoSidewaysScroll, PAGES, seedPracticeData } from './helpers.ts'

/**
 * Browser zoom makes the page narrower in CSS pixels: 200% zoom on a 1280px-wide window
 * lays out like a 640px-wide one, and 400% like a 320px one (the WCAG reflow test).
 */
const ZOOM_LEVELS = [
  { zoom: '200%', width: 640, height: 400 },
  { zoom: '400%', width: 320, height: 256 },
]

async function startSession(page: Page) {
  await page.goto('./practice/setup')
  await page.getByRole('button', { name: 'Start Session' }).click()
}

test.describe('browser zoom', () => {
  for (const { zoom, width, height } of ZOOM_LEVELS) {
    test(`every page fits at ${zoom} without sideways scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await seedPracticeData(page)

      for (const [, path] of PAGES) {
        await page.goto(path)
        await expectNoSidewaysScroll(page)
      }
    })

    test(`a question can be answered at ${zoom}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await startSession(page)

      await expectNoSidewaysScroll(page)
      await page
        .getByRole('button', { name: /^Answer / })
        .first()
        .click()
      await page.getByRole('button', { name: 'Flip Card' }).click()
      await page.getByRole('button', { name: 'I Got It Right' }).click()
      await page.getByRole('button', { name: 'Next Question' }).click()
      await expect(page.getByText('Question 2 of 10', { exact: true })).toBeVisible()
      await expectNoSidewaysScroll(page)
    })
  }

  test('text set to 200% in the browser still fits', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '200%'
      })
    })
    await seedPracticeData(page)

    for (const [, path] of PAGES) {
      await page.goto(path)
      await expectNoSidewaysScroll(page)
    }
    await startSession(page)
    await expectNoSidewaysScroll(page)
  })
})

/** Every running CSS transition or animation longer than a moment, as "class: property". */
const movingElements = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .map((element) => ({ element, style: getComputedStyle(element) }))
      .filter(
        ({ style }) =>
          style.transitionDuration.split(',').some((d) => parseFloat(d) > 0.01) ||
          (style.animationName !== 'none' && parseFloat(style.animationDuration) > 0.01),
      )
      .map(({ element }) => element.className.toString() || element.tagName),
  )

test.describe('reduced motion', () => {
  test('nothing moves when the device asks for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await startSession(page)
    await page
      .getByRole('button', { name: /^Answer / })
      .first()
      .click()
    await page.getByRole('button', { name: 'Flip Card' }).click()
    await page.getByRole('button', { name: 'I Got It Right' }).click()

    expect(await movingElements(page)).toEqual([])
    await page.getByRole('button', { name: 'Next Question' }).click()
    expect(await movingElements(page)).toEqual([])
  })

  test('the card flips with animation otherwise', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await startSession(page)

    expect(await movingElements(page)).toContain('question-card__inner')
  })
})
