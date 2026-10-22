import { expect, test, type Page } from '@playwright/test'

/**
 * The app on a slow phone: the CPU slowed down 6× and a slow 4G connection, with a full
 * practice history. Budgets are about 3× what was measured, so they catch real slowdowns
 * (like rewriting thousands of saved answers on every tap) without failing on a busy machine.
 * See docs/PERFORMANCE.md for the measurements.
 */

// One at a time: they measure how busy the CPU is.
test.describe.configure({ mode: 'serial' })

async function slowDown(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
}

/** Saves `count` answers, as if from months of practice. */
async function saveHistory(page: Page, count: number) {
  await page.evaluate((count) => {
    const start = Date.parse('2026-01-01T00:00:00.000Z')
    const attempts = Array.from({ length: count }, (_, i) => ({
      sessionId: `s${Math.floor(i / 10)}`,
      question: {
        id: `q${i}`,
        operation: 'multiplication',
        difficulty: 'easy',
        leftOperand: 7,
        rightOperand: 8,
        correctAnswer: 56,
        displayText: '7 × 8',
      },
      userAnswer: 56,
      isCorrect: i % 4 !== 0,
      timeTakenMs: 3000,
      answeredAt: new Date(start + i * 1000).toISOString(),
    }))
    const sessions = Array.from({ length: count / 10 }, (_, i) => ({
      id: `s${i}`,
      config: { operations: ['multiplication'], difficulty: 'easy', sessionLength: 10 },
      isReview: false,
      startedAt: new Date(start + i * 10_000).toISOString(),
      completedAt: new Date(start + i * 10_000 + 9000).toISOString(),
      totalAttempts: 10,
      correctAttempts: 7,
    }))
    localStorage.setItem('math-practice:schema-version', '3')
    localStorage.setItem('math-practice:attempts', JSON.stringify(attempts))
    localStorage.setItem('math-practice:sessions', JSON.stringify(sessions))
  }, count)
}

/** Total time the page was too busy to respond (tasks over 50 ms) while `action` ran. */
async function busyTime(page: Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    const w = window as unknown as { busy: number; observer?: PerformanceObserver }
    w.busy = 0
    w.observer?.disconnect()
    w.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.busy += entry.duration
    })
    w.observer.observe({ type: 'longtask' })
  })
  await action()
  await page.waitForTimeout(500) // Let any saving that follows the tap finish.
  return page.evaluate(() => (window as unknown as { busy: number }).busy)
}

test('the first page is usable within 4 seconds on a slow phone', async ({ page }) => {
  await slowDown(page)
  const started = Date.now()
  await page.goto('./')
  await expect(page.getByRole('link', { name: 'Start Practice' })).toBeVisible()

  expect(Date.now() - started).toBeLessThan(4000)
})

test('answering stays responsive with a full history on a slow phone', async ({ page }) => {
  await page.goto('./')
  await saveHistory(page, 5000)
  await slowDown(page)
  await page.goto('./practice/setup')
  await page.getByRole('button', { name: 'Start Session' }).click()

  // The first answer also reads the saved history for the first time (and trims it to the
  // limit kept in full); measure the ones after.
  const timings: { marking: number; next: number }[] = []
  for (let question = 0; question < 4; question++) {
    await page
      .getByRole('button', { name: /^Answer / })
      .first()
      .click()
    await page.getByRole('button', { name: 'Flip Card' }).click()
    const marking = await busyTime(page, () =>
      page.getByRole('button', { name: 'I Got It Right' }).click(),
    )
    const next = await busyTime(page, () =>
      page.getByRole('button', { name: 'Next Question' }).click(),
    )
    if (question > 0) timings.push({ marking, next })
  }

  for (const { marking, next } of timings) {
    expect(marking, 'busy after marking an answer (ms)').toBeLessThan(250)
    expect(next, 'busy after Next Question (ms)').toBeLessThan(200)
  }
})
