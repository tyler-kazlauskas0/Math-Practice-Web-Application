import { defineConfig, devices, type Project } from '@playwright/test'

/**
 * Real-browser tests: browser zoom, color contrast, focus, motion, privacy, deployment, and a
 * slow phone. By default they run against the production build served the way Netlify and
 * Cloudflare Pages serve it (npm run build, then scripts/serve-dist.mjs).
 *
 * - First time: `npx playwright install` (Chromium, Firefox, and WebKit, Safari's engine).
 * - Real Google Chrome and Microsoft Edge too: install them (`npx playwright install chrome
 *   msedge`) and set E2E_BRANDED_BROWSERS=1.
 * - Only some browsers: `npx playwright test --project=chromium --project=firefox`.
 * - The live site instead: set E2E_BASE_URL to its address (see docs/DEPLOYMENT.md).
 * - To use a Chromium that's already installed, set PLAYWRIGHT_CHROMIUM_PATH.
 */

const LOCAL_URL = 'http://localhost:4173/'
// Pages are opened relative to this (e.g. './settings'), so it must end with a slash.
const baseURL = (process.env.E2E_BASE_URL ?? LOCAL_URL).replace(/\/?$/, '/')

const chromiumPath = { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined }
/** Measured timings only mean something in one engine, on its own (see slowDevice.spec.ts). */
const notTimings = { testIgnore: /slowDevice/ }

const browsers: Project[] = [
  {
    name: 'chromium',
    ...notTimings,
    use: { ...devices['Desktop Chrome'], launchOptions: chromiumPath },
  },
  { name: 'firefox', ...notTimings, use: devices['Desktop Firefox'] },
  { name: 'webkit', ...notTimings, use: devices['Desktop Safari'] },
  {
    name: 'android phone',
    ...notTimings,
    use: { ...devices['Pixel 7'], launchOptions: chromiumPath },
  },
  { name: 'iphone', ...notTimings, use: devices['iPhone 14'] },
  { name: 'ipad', ...notTimings, use: devices['iPad Pro 11'] },
]

if (process.env.E2E_BRANDED_BROWSERS) {
  browsers.push(
    {
      name: 'google chrome',
      ...notTimings,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'microsoft edge',
      ...notTimings,
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  )
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    ...browsers,
    {
      // Timing tests run on their own after the others, one at a time, so other tests running
      // in parallel can't slow them down.
      name: 'slow device',
      testMatch: /slowDevice/,
      dependencies: ['chromium'],
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumPath },
    },
  ],
  // Testing the live site needs no local server.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm run preview:host',
        url: LOCAL_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
