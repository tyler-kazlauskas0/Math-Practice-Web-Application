import { describe, expect, it } from 'vitest'
import { formatShare, formatStorageSize } from './format'

describe('formatStorageSize', () => {
  it.each([
    [0, 'about 1 KB'],
    [400, 'about 1 KB'],
    [120_400, 'about 120 KB'],
    [999_000, 'about 999 KB'],
    [1_490_000, 'about 1.5 MB'],
  ])('%i characters → %s', (characters, text) => {
    expect(formatStorageSize(characters)).toBe(text)
  })
})

describe('formatShare', () => {
  it.each([
    [0, '0%'],
    [0.001, 'less than 1%'],
    [0.03, '3%'],
    [1, '100%'],
  ])('%f → %s', (fraction, text) => {
    expect(formatShare(fraction)).toBe(text)
  })
})
