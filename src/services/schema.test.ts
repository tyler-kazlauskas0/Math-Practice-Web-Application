import { describe, expect, it, vi } from 'vitest'
import { CURRENT_SCHEMA_VERSION, migrateStorage, readSchemaVersion } from './schema'

const VERSION_KEY = 'math-practice:schema-version'

describe('schema versioning', () => {
  it('treats missing or unreadable versions as version 0', () => {
    expect(readSchemaVersion()).toBe(0)
    localStorage.setItem(VERSION_KEY, 'banana')
    expect(readSchemaVersion()).toBe(0)
  })

  it('stores the current version after migrating', () => {
    expect(migrateStorage()).toBe('migrated')

    expect(localStorage.getItem(VERSION_KEY)).toBe(String(CURRENT_SCHEMA_VERSION))
    expect(migrateStorage()).toBe('up-to-date')
  })

  it('keeps settings saved before versioning existed', () => {
    localStorage.setItem('math-practice:settings', '{"animationsEnabled":false}')

    migrateStorage()

    expect(localStorage.getItem('math-practice:settings')).toBe('{"animationsEnabled":false}')
  })

  it('runs each needed migration once, in order', () => {
    const calls: string[] = []
    const migrations = {
      0: () => calls.push('0→1'),
      1: () => calls.push('1→2'),
      2: () => calls.push('2→3'),
    }
    localStorage.setItem(VERSION_KEY, '1')

    expect(migrateStorage(migrations, 3)).toBe('migrated')
    expect(calls).toEqual(['1→2', '2→3'])
    expect(localStorage.getItem(VERSION_KEY)).toBe('3')

    expect(migrateStorage(migrations, 3)).toBe('up-to-date')
    expect(calls).toHaveLength(2)
  })

  it('stops at the last version that worked if a migration fails', () => {
    const migrations = {
      0: vi.fn(),
      1: () => {
        throw new Error('broken migration')
      },
    }

    expect(migrateStorage(migrations, 2)).toBe('failed')
    expect(localStorage.getItem(VERSION_KEY)).toBe('1')
  })

  it('leaves data from a newer version of the app untouched', () => {
    localStorage.setItem(VERSION_KEY, '99')
    localStorage.setItem('math-practice:sessions', '["from the future"]')

    expect(migrateStorage()).toBe('newer-version')
    expect(localStorage.getItem(VERSION_KEY)).toBe('99')
    expect(localStorage.getItem('math-practice:sessions')).toBe('["from the future"]')
  })

  it('never deletes data that belongs to something else', () => {
    localStorage.setItem('other-app:data', 'keep me')
    localStorage.setItem('math-practice:unknown-key', 'keep me too')

    migrateStorage()

    expect(localStorage.getItem('other-app:data')).toBe('keep me')
    expect(localStorage.getItem('math-practice:unknown-key')).toBe('keep me too')
  })
})
