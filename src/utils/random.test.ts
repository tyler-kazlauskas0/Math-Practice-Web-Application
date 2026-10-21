import { describe, expect, it } from 'vitest'
import { pickRandom, randomInt, shuffle } from './random'

describe('randomInt', () => {
  it('returns min when random gives 0 and max when random gives almost 1', () => {
    expect(randomInt(3, 7, () => 0)).toBe(3)
    expect(randomInt(3, 7, () => 0.9999999)).toBe(7)
  })

  it('stays within range and reaches every value', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      const value = randomInt(1, 5)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(5)
      seen.add(value)
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('returns the only value when min equals max', () => {
    expect(randomInt(4, 4)).toBe(4)
  })

  it('rejects an empty or fractional range', () => {
    expect(() => randomInt(5, 1)).toThrow(RangeError)
    expect(() => randomInt(1.5, 3)).toThrow(RangeError)
  })
})

describe('pickRandom', () => {
  it('returns an item chosen by the random source', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 0)).toBe('a')
    expect(pickRandom(['a', 'b', 'c'], () => 0.5)).toBe('b')
    expect(pickRandom(['a', 'b', 'c'], () => 0.9999999)).toBe('c')
  })

  it('rejects an empty array', () => {
    expect(() => pickRandom([])).toThrow(RangeError)
  })
})

describe('shuffle', () => {
  it('returns a new array with the same items', () => {
    const items = [1, 2, 3, 4, 5]
    const result = shuffle(items)

    expect(result).not.toBe(items)
    expect([...result].sort()).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  it('reorders items according to the random source', () => {
    // Always swapping with index 0 rotates the array: [1,2,3] → [3,1,2] → [2,3,1]
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1])
    // Always swapping an item with itself leaves the order unchanged.
    expect(shuffle([1, 2, 3], () => 0.9999999)).toEqual([1, 2, 3])
  })

  it('handles empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle(['only'])).toEqual(['only'])
  })
})
