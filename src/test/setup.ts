import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no layout, so scrolling does nothing (and would log "Not implemented").
if (typeof window !== 'undefined') window.scrollTo = () => {}

// Unmount rendered components and clear saved data between tests so they don't leak into each other.
afterEach(() => {
  cleanup()
  // Some tests (e.g. the contrast check) run without a browser environment.
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
