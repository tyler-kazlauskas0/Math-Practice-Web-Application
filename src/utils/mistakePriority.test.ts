import { describe, expect, it } from 'vitest'
import { makePattern } from '../test/makePattern'
import { randomSequence } from '../test/randomSequence'
import { mistakePriority, prioritizePatterns } from './mistakePriority'

const NOW = Date.parse('2026-10-21T12:00:00.000Z')
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString()
const noJitter = () => 0
const order = (patterns: ReturnType<typeof makePattern>[]) =>
  prioritizePatterns(patterns, { now: NOW, threshold: 3, random: noJitter }).map((p) => p.key)

describe('mistakePriority', () => {
  const base = { lastIncorrectAt: daysAgo(1), incorrectCount: 2, similarCorrectCount: 1 }

  it('is higher for patterns missed more often', () => {
    const often = makePattern(7, 'multiplication', 8, { ...base, incorrectCount: 5 })
    const rarely = makePattern(6, 'multiplication', 8, { ...base, incorrectCount: 1 })

    expect(mistakePriority(often, NOW, 3)).toBeGreaterThan(mistakePriority(rarely, NOW, 3))
  })

  it('is higher for patterns missed more recently', () => {
    const recent = makePattern(7, 'multiplication', 8, { ...base, lastIncorrectAt: daysAgo(0) })
    const old = makePattern(6, 'multiplication', 8, { ...base, lastIncorrectAt: daysAgo(30) })

    expect(mistakePriority(recent, NOW, 3)).toBeGreaterThan(mistakePriority(old, NOW, 3))
  })

  it('is higher for patterns with less successful review', () => {
    const none = makePattern(7, 'multiplication', 8, { ...base, similarCorrectCount: 0 })
    const some = makePattern(6, 'multiplication', 8, { ...base, similarCorrectCount: 2 })

    expect(mistakePriority(none, NOW, 3)).toBeGreaterThan(mistakePriority(some, NOW, 3))
  })

  it('stops counting misses after a cap, so one fact cannot crowd out the rest forever', () => {
    const five = makePattern(7, 'multiplication', 8, { ...base, incorrectCount: 5 })
    const fifty = makePattern(6, 'multiplication', 8, { ...base, incorrectCount: 50 })

    expect(mistakePriority(fifty, NOW, 3)).toBe(mistakePriority(five, NOW, 3))
  })
})

describe('prioritizePatterns', () => {
  it('orders patterns from most to least urgent', () => {
    const urgent = makePattern(7, 'multiplication', 8, {
      incorrectCount: 5,
      lastIncorrectAt: daysAgo(0),
      similarCorrectCount: 0,
    })
    const middle = makePattern(9, 'subtraction', 4, {
      incorrectCount: 2,
      lastIncorrectAt: daysAgo(3),
      similarCorrectCount: 1,
    })
    const calm = makePattern(3, 'addition', 4, {
      incorrectCount: 1,
      lastIncorrectAt: daysAgo(60),
      similarCorrectCount: 2,
    })

    expect(order([calm, urgent, middle])).toEqual([urgent.key, middle.key, calm.key])
  })

  it('leaves out mastered patterns', () => {
    const mastered = makePattern(7, 'multiplication', 8, { masteredAt: daysAgo(1) })
    const active = makePattern(9, 'subtraction', 4)

    expect(order([mastered, active])).toEqual([active.key])
  })

  it('puts patterns of similar priority in random order', () => {
    const a = makePattern(7, 'multiplication', 8)
    const b = makePattern(6, 'multiplication', 8)
    const prioritize = (random: () => number) =>
      prioritizePatterns([a, b], { now: NOW, threshold: 3, random }).map((p) => p.key)

    expect(prioritize(randomSequence(0.9, 0.1))).toEqual([a.key, b.key])
    expect(prioritize(randomSequence(0.1, 0.9))).toEqual([b.key, a.key])
  })

  it('never lets randomness put a much less urgent pattern first', () => {
    const urgent = makePattern(7, 'multiplication', 8, {
      incorrectCount: 5,
      lastIncorrectAt: daysAgo(0),
    })
    const calm = makePattern(3, 'addition', 4, {
      incorrectCount: 1,
      lastIncorrectAt: daysAgo(60),
      similarCorrectCount: 2,
    })

    const worstCase = randomSequence(0, 0.9999999)
    expect(
      prioritizePatterns([calm, urgent], { now: NOW, threshold: 3, random: worstCase })[0],
    ).toBe(urgent)
  })
})
