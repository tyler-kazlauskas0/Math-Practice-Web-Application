import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
