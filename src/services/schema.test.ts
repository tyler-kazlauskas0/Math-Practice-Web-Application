import { describe, expect, it, vi } from 'vitest'
import { loadMistakePatterns } from './mistakePatterns'
import { loadArchive } from './practiceHistory'
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

  it('upgrades a version 1 history archive, keeping its totals', () => {
    localStorage.setItem(VERSION_KEY, '1')
    localStorage.setItem(
      'math-practice:history-archive',
      JSON.stringify({ sessionCount: 4, totalAttempts: 30, correctAttempts: 20 }),
    )

    expect(migrateStorage()).toBe('migrated')

    expect(loadArchive()).toMatchObject({
      sessionCount: 4,
      totalAttempts: 30,
      correctAttempts: 20,
      byOperation: { addition: { totalAttempts: 0, correctAttempts: 0 } },
      byDifficulty: { advanced: { totalAttempts: 0, correctAttempts: 0 } },
    })
  })

  it('builds mistake patterns from wrong answers saved before version 3', () => {
    const wrongAnswer = (answeredAt: string, userAnswer: number) => ({
      sessionId: 's1',
      question: {
        id: answeredAt,
        operation: 'multiplication',
        difficulty: 'easy',
        leftOperand: 7,
        rightOperand: 8,
        correctAnswer: 56,
        displayText: '7 × 8',
      },
      userAnswer,
      isCorrect: false,
      timeTakenMs: 1000,
      answeredAt,
    })
    localStorage.setItem(VERSION_KEY, '2')
    localStorage.setItem(
      'math-practice:attempts',
      JSON.stringify([
        wrongAnswer('2026-10-21T10:00:00.000Z', 54),
        { ...wrongAnswer('2026-10-21T10:01:00.000Z', 56), isCorrect: true },
        wrongAnswer('2026-10-21T10:02:00.000Z', 63),
        { broken: true },
      ]),
    )

    expect(migrateStorage()).toBe('migrated')

    expect(loadMistakePatterns()).toEqual([
      expect.objectContaining({
        key: 'multiplication:7:8',
        incorrectCount: 2,
        incorrectAnswers: [54, 63],
        lastIncorrectAt: '2026-10-21T10:02:00.000Z',
      }),
    ])
  })
})
