import type { PracticeAttempt, PracticeSessionState } from '../types/session'
import { isPracticeConfig } from '../utils/practiceConfig'
import { isValidQuestion } from '../utils/questions/validateQuestion'
import { readJson, removeItem, writeJson } from './storage'

export const ACTIVE_SESSION_KEY = 'active-session'

/** What the question card was showing, so a refresh puts the player back in the same spot. */
export interface SavedCardState {
  /** The question the card is for, so stale card state is never applied to a different question. */
  questionId: string
  selectedAnswer: number | null
  isCardFlipped: boolean
}

/** A session in progress, saved after every change so it survives a refresh or closed tab. */
export interface SavedActiveSession {
  /**
   * The browser history entry the session was started in. It stays the same across a
   * refresh, so the page can tell "refreshed" (resume) from "started a new session".
   */
  locationKey: string
  session: PracticeSessionState
  card: SavedCardState | null
}

const isAttempt = (value: unknown): value is PracticeAttempt => {
  const attempt = value as PracticeAttempt | null
  return (
    typeof attempt === 'object' &&
    attempt !== null &&
    isValidQuestion(attempt.question) &&
    typeof attempt.userAnswer === 'number' &&
    typeof attempt.isCorrect === 'boolean' &&
    typeof attempt.timeTakenMs === 'number' &&
    typeof attempt.answeredAt === 'string'
  )
}

/** Checks saved data thoroughly: a broken record is ignored rather than resumed. */
export function parseActiveSession(data: unknown): SavedActiveSession | null {
  const saved = data as SavedActiveSession | null
  const session = saved?.session
  const round = session?.currentRound
  const valid =
    typeof saved?.locationKey === 'string' &&
    typeof session === 'object' &&
    session !== null &&
    session.isActive === true &&
    typeof session.id === 'string' &&
    isPracticeConfig(session.config) &&
    Array.isArray(session.attempts) &&
    session.attempts.every(isAttempt) &&
    round !== null &&
    typeof round === 'object' &&
    isValidQuestion(round.question) &&
    Array.isArray(round.choices) &&
    round.choices.includes(round.question.correctAnswer) &&
    Number.isInteger(session.currentQuestionIndex) &&
    session.currentQuestionIndex >= 0 &&
    session.currentQuestionIndex >= session.attempts.length - 1 &&
    typeof session.correctCount === 'number' &&
    typeof session.incorrectCount === 'number' &&
    typeof session.startedAt === 'string' &&
    (session.reviewQuestions === null ||
      (Array.isArray(session.reviewQuestions) && session.reviewQuestions.every(isValidQuestion))) &&
    (session.reviewPatternOrder === null ||
      (Array.isArray(session.reviewPatternOrder) &&
        session.reviewPatternOrder.every((key) => typeof key === 'string')))
  if (!valid) return null

  const card = saved.card
  const cardValid =
    card !== null &&
    typeof card === 'object' &&
    card.questionId === round.question.id &&
    typeof card.isCardFlipped === 'boolean' &&
    (card.selectedAnswer === null || round.choices.includes(card.selectedAnswer))
  return { locationKey: saved.locationKey, session, card: cardValid ? card : null }
}

/** The session in progress, or `null` if there isn't one (or the saved data is broken). */
export function loadActiveSession(): SavedActiveSession | null {
  const saved = readJson(ACTIVE_SESSION_KEY, parseActiveSession)
  return saved.status === 'ok' ? saved.value : null
}

/** Saves the session in progress. Finished sessions are removed instead. */
export function saveActiveSession(saved: SavedActiveSession): void {
  if (!saved.session.isActive) {
    clearActiveSession()
    return
  }
  writeJson(ACTIVE_SESSION_KEY, saved)
}

/** Forgets the session in progress, e.g. once it ends. */
export function clearActiveSession(): void {
  removeItem(ACTIVE_SESSION_KEY)
}
