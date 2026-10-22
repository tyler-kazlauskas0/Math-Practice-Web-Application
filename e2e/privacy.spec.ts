import { expect, test } from '@playwright/test'
import { playSession, ROUTES_TO_VERIFY } from './helpers.ts'

/**
 * The app collects nothing and sends nothing: every request stays on the app's own site,
 * nothing but the app's own practice data is saved, and the page's security policy blocks
 * sending data anywhere, even by accident. See docs/PRIVACY.md.
 */

test('never contacts another site, and saves only its own practice data', async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin
  const otherSites: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin !== origin && url.protocol !== 'data:') otherSites.push(request.url())
  })

  for (const [path] of ROUTES_TO_VERIFY) await page.goto(path)
  await playSession(page)
  await page.goto('./statistics')
  await page.goto('./settings')

  expect(otherSites).toEqual([])
  expect(await context.cookies()).toEqual([])
  const saved = await page.evaluate(async () => ({
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage),
    databases: (await indexedDB.databases?.())?.map((db) => db.name) ?? [],
  }))
  expect(saved.localStorage.length).toBeGreaterThan(0)
  expect(saved.localStorage.every((key) => key.startsWith('math-practice:'))).toBe(true)
  expect(saved.sessionStorage).toEqual([])
  expect(saved.databases).toEqual([])
})

test('blocks sending data anywhere, even if some code tried to', async ({ page }) => {
  // Anything that actually gets out to the network ends up here.
  const reached: string[] = []
  await page.route('**/collect*', (route) => {
    reached.push(route.request().url())
    return route.abort()
  })
  await page.route('https://example.com/**', (route) => {
    reached.push(route.request().url())
    return route.abort()
  })
  await page.goto('./')

  const results = await page.evaluate(async () => {
    const attempt = async (send: () => Promise<unknown>) =>
      send().then(
        () => 'sent',
        () => 'blocked',
      )
    const load = (element: HTMLScriptElement | HTMLImageElement, src: string) =>
      new Promise((resolve) => {
        element.onload = () => resolve('sent')
        element.onerror = () => resolve('blocked')
        element.src = src
        document.body.append(element)
      })
    // A beacon is queued without saying whether it was blocked; the route above would see it.
    navigator.sendBeacon('https://example.com/collect', 'score=10')
    return {
      otherSite: await attempt(() => fetch('https://example.com/collect?score=10')),
      ownSite: await attempt(() => fetch('./collect?score=10')),
      script: await load(document.createElement('script'), 'https://example.com/tracker.js'),
      image: await load(new Image(), 'https://example.com/collect.gif?score=10'),
    }
  })
  await page.waitForTimeout(500)

  expect(results).toEqual({
    otherSite: 'blocked',
    ownSite: 'blocked',
    script: 'blocked',
    image: 'blocked',
  })
  expect(reached).toEqual([])
})

test('the host sends the security headers', async ({ page }) => {
  const response = await page.goto('./settings')
  const headers = response!.headers()

  expect(headers['content-security-policy']).toContain("connect-src 'none'")
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('no-referrer')
  expect(headers['permissions-policy']).toContain('camera=()')
})

test('explains to parents that progress stays in this browser', async ({ page }) => {
  await page.goto('./settings')
  const section = page.getByRole('region', { name: 'Your data' })

  await expect(section).toContainText('saved only in this browser, on this device')
  await expect(section).toContainText('no accounts, no ads, and no tracking')
  await expect(section).toContainText('Clearing this browser’s history or site data')
})
