import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../test/makeQuestion'
import { startSession } from '../utils/practiceSession'
import {
  clearActiveSession,
  loadActiveSession,
  parseActiveSession,
  saveActiveSession,
} from './activeSession'

const question = { ...makeQuestion(7, 'multiplication', 8), id: 'q1' }
const session = startSession(
  { operations: ['multiplication'], difficulty: 'easy', sessionLength: 5 },
  { question, choices: [54, 56, 63, 48] },
  Date.parse('2026-10-22T10:00:00.000Z'),
)
const saved = {
  locationKey: 'abc',
  session,
  card: { questionId: 'q1', selectedAnswer: 63, isCardFlipped: false },
}

describe('active session storage', () => {
  it('saves and loads a session in progress with its card', () => {
    saveActiveSession(saved)

    expect(loadActiveSession()).toEqual(saved)
  })

  it('removes the saved session when it has ended', () => {
    saveActiveSession(saved)
    saveActiveSession({ ...saved, session: { ...session, isActive: false } })

    expect(loadActiveSession()).toBeNull()
  })

  it('can be cleared', () => {
    saveActiveSession(saved)
    clearActiveSession()

    expect(loadActiveSession()).toBeNull()
  })

  it.each([
    ['nothing', null],
    ['an ended session', { ...saved, session: { ...session, isActive: false } }],
    ['no history key', { ...saved, locationKey: 7 }],
    [
      'an invalid question',
      {
        ...saved,
        session: {
          ...session,
          currentRound: { question: { ...question, correctAnswer: 1 }, choices: [1, 2, 3, 4] },
        },
      },
    ],
    [
      'choices without the answer',
      { ...saved, session: { ...session, currentRound: { question, choices: [1, 2, 3, 4] } } },
    ],
    ['a broken config', { ...saved, session: { ...session, config: { operations: [] } } }],
  ])('ignores %s', (_, data) => {
    expect(parseActiveSession(data)).toBeNull()
  })

  it('keeps the session but drops card state that belongs to another question', () => {
    const parsed = parseActiveSession({ ...saved, card: { ...saved.card, questionId: 'other' } })

    expect(parsed?.session).toEqual(session)
    expect(parsed?.card).toBeNull()
  })

  it('drops a selected answer that is not one of the choices', () => {
    expect(
      parseActiveSession({ ...saved, card: { ...saved.card, selectedAnswer: 999 } })?.card,
    ).toBeNull()
  })
})
