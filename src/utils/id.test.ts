import { afterEach, describe, expect, it, vi } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a different non-empty string each time', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()))

    expect(ids.size).toBe(1000)
    ids.forEach((id) => expect(id).not.toBe(''))
  })

  it('still returns unique IDs when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {})

    const ids = new Set(Array.from({ length: 1000 }, () => createId()))

    expect(ids.size).toBe(1000)
  })
})
