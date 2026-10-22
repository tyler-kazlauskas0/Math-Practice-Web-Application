import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'

// jsdom has no layout, so scrolling does nothing (and would log "Not implemented").
if (typeof window !== 'undefined') window.scrollTo = () => {}

// Pages that the app downloads separately are loaded up front, so every test can check a
// page as soon as it's rendered. (How they load on demand is tested in lazyPage.test.tsx.)
beforeAll(async () => {
  if (typeof window === 'undefined') return
  const { preloadPages } = await import('../routes')
  await preloadPages()
})

// Unmount rendered components and clear saved data between tests so they don't leak into each other.
afterEach(() => {
  cleanup()
  // Some tests (e.g. the contrast check) run without a browser environment.
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
