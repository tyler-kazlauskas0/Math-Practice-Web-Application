import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { ROUTES } from './src/data/routes.ts'

/**
 * Rules for the production page that make it impossible for it to send data anywhere or load
 * anything from another site: no trackers, ads, or outside scripts, even by accident.
 * (Inline styles are allowed because a few elements set their width, e.g. progress bars.)
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/**
 * HTTP headers for every page, in the `_headers` format Netlify and Cloudflare Pages read. The
 * same policy as above, plus what only a header can do: refuse to be shown inside another
 * site, and turn off the camera, microphone, and location, which the app never needs.
 */
const HEADERS = `/*
  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`

/**
 * Production-only additions:
 * - the Content-Security-Policy above in the page itself (not in development, where Vite
 *   needs inline scripts), so it applies on any host;
 * - `_headers` (above) for Netlify and Cloudflare Pages;
 * - a copy of the page for every address in the app (`statistics.html`, and
 *   `statistics/index.html` too), and as 404.html, so even a host without `_redirects` (see
 *   public/_redirects) can open or refresh any page directly.
 */
function productionPage(): Plugin {
  return {
    name: 'production-page',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
    writeBundle({ dir }) {
      if (!dir) return
      writeFileSync(join(dir, '_headers'), HEADERS)
      const index = join(dir, 'index.html')
      const copies = ['404.html']
      for (const path of Object.values(ROUTES)) {
        if (path !== '/') copies.push(`${path}.html`, `${path}/index.html`)
      }
      for (const copy of copies) {
        mkdirSync(dirname(join(dir, copy)), { recursive: true })
        copyFileSync(index, join(dir, copy))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), productionPage()],
  test: {
    environment: 'jsdom',
    // Only the unit, component, and integration tests. The real-browser tests in e2e/ run with Playwright.
    include: ['src/**/*.test.{ts,tsx}'],
    // Whole-session journeys click through dozens of screens, which takes a few seconds,
    // and longer with coverage turned on or on a slower computer.
    testTimeout: 15_000,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
    },
  },
})
