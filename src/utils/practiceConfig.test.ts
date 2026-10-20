import { describe, expect, it } from 'vitest'
import { isPracticeConfig } from './practiceConfig'

describe('isPracticeConfig', () => {
  it('accepts a valid configuration', () => {
    expect(
      isPracticeConfig({
        operations: ['addition', 'division'],
        difficulty: 'beginner',
        sessionLength: 'continuous',
      }),
    ).toBe(true)
  })

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['no operations', { operations: [], difficulty: 'easy', sessionLength: 10 }],
    ['an unknown operation', { operations: ['modulo'], difficulty: 'easy', sessionLength: 10 }],
    ['an unknown difficulty', { operations: ['addition'], difficulty: 'hard', sessionLength: 10 }],
    ['an unknown length', { operations: ['addition'], difficulty: 'easy', sessionLength: 7 }],
  ])('rejects %s', (_, value) => {
    expect(isPracticeConfig(value)).toBe(false)
  })
})
