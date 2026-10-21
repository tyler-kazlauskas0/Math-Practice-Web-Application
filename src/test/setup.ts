import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered components and clear saved data between tests so they don't leak into each other.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
