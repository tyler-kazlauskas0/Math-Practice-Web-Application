import { expect, test, type Page } from '@playwright/test'
import { playSession, ROUTES_TO_VERIFY } from './helpers.ts'

/**
 * Checks a deployed build: run against the build served locally the way the host serves it (the
 * default) or the live site (set E2E_BASE_URL). See docs/DEPLOYMENT.md.
 */

/**
 * The browser's own note that the server answered "404 Not Found". Expected (and correct) only
 * for an address that isn't part of the app.
 */
const NOT_FOUND = /^error: Failed to load resource: .*404/

/** Collects anything written to the browser console, and any uncaught error. */
function watchConsole(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => {
    const text = `${message.type()}: ${message.text()}`
    const url = message.location().url
    // Opening an address that isn't part of the app shows the app's "Page not found".
    if (NOT_FOUND.test(text) && url.includes('no-such-page')) return
    messages.push(text)
  })
  page.on('pageerror', (error) => messages.push(`uncaught: ${error.message}`))
  return messages
}

test.describe('every address', () => {
  for (const [path, heading] of ROUTES_TO_VERIFY) {
    test(`${path} opens directly and after a refresh`, async ({ page }) => {
      const console = watchConsole(page)

      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
      await page.reload()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)

      expect(console).toEqual([])
    })
  }

  test('links stay inside the app’s folder on the site', async ({ page, baseURL }) => {
    const folder = new URL(baseURL!).pathname
    await page.goto('./')

    const links = await page
      .locator('a[href]')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')!))
    expect(links.length).toBeGreaterThan(3)
    for (const href of links.filter((href) => href.startsWith('/'))) {
      expect(href.startsWith(folder) || href === folder.replace(/\/$/, '')).toBe(true)
    }

    // Moving around with the menu works, and the address can then be refreshed.
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Settings' })
      .click()
    await expect(page).toHaveURL(new URL('settings', baseURL).href)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
  })
})

test.describe('saved progress', () => {
  test('is still there after closing the tab and opening the app again', async ({ context }) => {
    const first = await context.newPage()
    await playSession(first)
    await first.close()

    const second = await context.newPage()
    await second.goto('./statistics')
    const overall = second.getByLabel('Overall results')
    await expect(overall).toContainText('5')
    await expect(overall).toContainText('100%')
  })

  test('a session in progress continues after a refresh', async ({ page }) => {
    await page.goto('./practice/setup')
    await page.getByRole('button', { name: 'Start Session' }).click()
    await page
      .getByRole('button', { name: /^Answer / })
      .first()
      .click()
    await page.getByRole('button', { name: 'Flip Card' }).click()
    await page.getByRole('button', { name: 'I Got It Right' }).click()
    await page.getByRole('button', { name: 'Next Question' }).click()
    const question = await page.getByRole('heading', { level: 2 }).textContent()

    await page.reload()

    await expect(page.getByText('right where you left off')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(question!)
    await expect(page.getByText('Question 2 of 10', { exact: true })).toBeVisible()
  })
})

test('a whole visit writes nothing to the console', async ({ page }) => {
  const console = watchConsole(page)

  for (const [path] of ROUTES_TO_VERIFY) await page.goto(path)
  await playSession(page)
  await page.getByRole('link', { name: 'View Statistics' }).click()
  await page
    .getByRole('link', { name: 'See All Mistakes' })
    .or(page.getByText('No mistakes so far'))
    .waitFor()
  await page.goto('./settings')
  await page.getByRole('checkbox', { name: 'Sound effects' }).click()

  expect(console).toEqual([])
})
