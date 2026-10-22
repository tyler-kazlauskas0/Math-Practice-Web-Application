import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllAppData,
  getStorageUsage,
  isQuotaExceededError,
  isStorageAvailable,
  readJson,
  readText,
  removeItem,
  writeJson,
  writeText,
} from './storage'

const asNumberList = (data: unknown) =>
  Array.isArray(data) && data.every((n) => typeof n === 'number') ? (data as number[]) : null

function blockStorage() {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('Blocked', 'SecurityError')
  })
}

describe('storage service', () => {
  afterEach(() => vi.restoreAllMocks())

  it('writes and reads JSON under the app prefix', () => {
    expect(writeJson('numbers', [1, 2, 3])).toEqual({ ok: true })

    expect(localStorage.getItem('math-practice:numbers')).toBe('[1,2,3]')
    expect(readJson('numbers', asNumberList)).toEqual({ status: 'ok', value: [1, 2, 3] })
  })

  it('reports missing data', () => {
    expect(readJson('nothing-here', asNumberList)).toEqual({ status: 'missing' })
  })

  it('reports broken JSON instead of throwing', () => {
    localStorage.setItem('math-practice:numbers', '{not json')

    expect(readJson('numbers', asNumberList)).toEqual({ status: 'invalid' })
  })

  it('reports data that fails validation', () => {
    writeJson('numbers', ['a', 'b'])

    expect(readJson('numbers', asNumberList)).toEqual({ status: 'invalid' })
  })

  it('handles storage being unavailable', () => {
    blockStorage()

    expect(isStorageAvailable()).toBe(false)
    expect(readText('anything')).toEqual({ status: 'unavailable' })
    expect(writeJson('anything', 1)).toEqual({ ok: false, reason: 'unavailable' })
    expect(() => removeItem('anything')).not.toThrow()
  })

  it('reports when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })

    expect(writeText('big', 'x')).toEqual({ ok: false, reason: 'quota-exceeded' })
  })

  it('recognizes the different ways browsers report a full storage', () => {
    expect(isQuotaExceededError(new DOMException('', 'QuotaExceededError'))).toBe(true)
    expect(isQuotaExceededError(new DOMException('', 'NS_ERROR_DOM_QUOTA_REACHED'))).toBe(true)
    expect(isQuotaExceededError(new Error('QuotaExceededError'))).toBe(false)
  })

  it('reports values that cannot be turned into JSON', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(writeJson('circular', circular)).toEqual({ ok: false, reason: 'unknown' })
  })

  it('only removes its own keys', () => {
    localStorage.setItem('other-app', 'keep me')
    writeText('mine', 'x')

    removeItem('mine')
    removeItem('other-app')

    expect(localStorage.getItem('math-practice:mine')).toBeNull()
    expect(localStorage.getItem('other-app')).toBe('keep me')
  })

  it('clears every app key, and nothing else', () => {
    writeText('settings', 'x')
    writeText('sessions', 'y')
    writeText('some-future-key', 'z')
    localStorage.setItem('other-app', 'keep me')

    clearAllAppData()

    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('other-app')).toBe('keep me')
  })
})

describe('getStorageUsage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('counts the characters of each of the app’s keys and values, and nothing else', () => {
    writeText('settings', '{"a":1}')
    writeText('attempts', '[]')
    localStorage.setItem('other-app', 'x'.repeat(1000))

    expect(getStorageUsage()).toEqual({
      total: 'math-practice:settings'.length + 7 + 'math-practice:attempts'.length + 2,
      byKey: {
        settings: 'math-practice:settings'.length + 7,
        attempts: 'math-practice:attempts'.length + 2,
      },
    })
  })

  it('reports nothing when storage is unavailable', () => {
    blockStorage()
    expect(getStorageUsage()).toEqual({ total: 0, byKey: {} })
  })
})
