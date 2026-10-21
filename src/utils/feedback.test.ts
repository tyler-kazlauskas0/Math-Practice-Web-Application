import { describe, expect, it } from 'vitest'
import { repeat } from '../test/randomSequence'
import { pickFeedback, POSITIVE_FEEDBACK, SUPPORTIVE_FEEDBACK, summaryFeedback } from './feedback'

/** Words that could make a child feel bad about a mistake. */
const SHAMING_WORDS =
  /\b(wrong|bad|fail|failed|failure|stupid|dumb|silly|oops|careless|easy|should have)\b/i

describe('pickFeedback', () => {
  it('praises right answers and encourages after wrong ones', () => {
    expect(POSITIVE_FEEDBACK).toContain(pickFeedback(true))
    expect(SUPPORTIVE_FEEDBACK).toContain(pickFeedback(false))
  })

  it('never repeats the same message twice in a row', () => {
    let previous: string | null = null
    repeat(200, () => {
      const next = pickFeedback(Math.random() < 0.5, previous)
      expect(next).not.toBe(previous)
      previous = next
    })
  })

  it('varies its messages', () => {
    const seen = new Set<string>()
    repeat(100, () => seen.add(pickFeedback(true)))
    expect(seen.size).toBeGreaterThanOrEqual(5)
  })
})

describe('feedback language', () => {
  it.each([
    ...POSITIVE_FEEDBACK,
    ...SUPPORTIVE_FEEDBACK,
    ...[0, 0.3, 0.6, 0.8, 1].map(summaryFeedback),
  ])('avoids shaming language: "%s"', (message) => {
    expect(message).not.toMatch(SHAMING_WORDS)
  })
})

describe('summaryFeedback', () => {
  it('matches the score, staying positive even when it is low', () => {
    expect(summaryFeedback(1)).toMatch(/amazing/i)
    expect(summaryFeedback(0.75)).toMatch(/great job/i)
    expect(summaryFeedback(0.5)).toMatch(/nice effort/i)
    expect(summaryFeedback(0.1)).toMatch(/keep going/i)
  })
})
