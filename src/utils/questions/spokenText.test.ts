import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../../test/makeQuestion'
import { speakAnswer, speakFact, speakQuestion } from './spokenText'

describe('spoken text', () => {
  it.each([
    [makeQuestion(3, 'addition', 4), '3 plus 4'],
    [makeQuestion(9, 'subtraction', 4), '9 minus 4'],
    [makeQuestion(7, 'multiplication', 8), '7 times 8'],
    [makeQuestion(56, 'division', 7), '56 divided by 7'],
  ])('says %o as "%s"', (question, words) => {
    expect(speakFact(question)).toBe(words)
  })

  it('asks the question and states the answer', () => {
    const question = makeQuestion(56, 'division', 7)

    expect(speakQuestion(question)).toBe('What is 56 divided by 7?')
    expect(speakAnswer(question)).toBe('56 divided by 7 equals 8.')
  })
})
