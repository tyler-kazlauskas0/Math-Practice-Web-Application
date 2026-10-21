import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../data/defaultSettings'
import { makePattern } from '../test/makePattern'
import { makeQuestion } from '../test/makeQuestion'
import { checkAndRepairStoredData, getStartupRepairs } from './dataHealth'
import { parseSettings } from './settingsStorage'

vi.mock('./settingsStorage', { spy: true })

const KEY = (name: string) => `math-practice:${name}`
const goodSession = {
  id: 's1',
  config: { operations: ['addition'], difficulty: 'easy', sessionLength: 5 },
  isReview: false,
  startedAt: '2026-10-22T10:00:00.000Z',
  completedAt: null,
  totalAttempts: 1,
  correctAttempts: 1,
}
const goodAttempt = {
  sessionId: 's1',
  question: makeQuestion(2, 'addition', 3),
  userAnswer: 5,
  isCorrect: true,
  timeTakenMs: 1000,
  answeredAt: '2026-10-22T10:00:01.000Z',
}

function saveGoodData() {
  localStorage.setItem(
    KEY('settings'),
    JSON.stringify({ ...DEFAULT_SETTINGS, animationsEnabled: false }),
  )
  localStorage.setItem(KEY('sessions'), JSON.stringify([goodSession]))
  localStorage.setItem(KEY('attempts'), JSON.stringify([goodAttempt]))
  localStorage.setItem(
    KEY('mistake-patterns'),
    JSON.stringify([makePattern(7, 'multiplication', 8)]),
  )
  localStorage.setItem('other-app', 'keep me')
}
const snapshot = () => Object.fromEntries(Object.entries(localStorage))

describe('checkAndRepairStoredData', () => {
  // Repairs are logged for developers; keep that out of the test output.
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it('leaves good data alone and reports nothing', () => {
    saveGoodData()
    const before = snapshot()

    expect(checkAndRepairStoredData()).toEqual([])
    expect(snapshot()).toEqual(before)
  })

  it.each([
    ['settings', 'settings', '{broken'],
    ['practice sessions', 'sessions', '"not a list"'],
    ['answers', 'attempts', '{broken'],
    ['mistakes', 'mistake-patterns', '{"not": "a list"}'],
    ['older statistics', 'history-archive', '{"sessionCount": "lots"}'],
    ['session in progress', 'active-session', '{"locationKey": 1}'],
  ])('resets only unreadable %s', (category, key, damaged) => {
    saveGoodData()
    localStorage.setItem(KEY(key), damaged)
    const before = snapshot()

    expect(checkAndRepairStoredData()).toEqual([{ category, outcome: 'reset' }])

    expect(localStorage.getItem(KEY(key))).toBeNull()
    // Everything else is untouched.
    const after = snapshot()
    delete before[KEY(key)]
    expect(after).toEqual(before)
  })

  it.each([
    ['practice sessions', 'sessions', [goodSession, { id: 'bad' }], 1],
    ['answers', 'attempts', [goodAttempt, 'junk', { ...goodAttempt, userAnswer: 'five' }], 1],
    ['mistakes', 'mistake-patterns', [makePattern(7, 'multiplication', 8), { key: 'x' }], 1],
  ])(
    'removes only the damaged %s records, keeping the good ones',
    (category, key, records, kept) => {
      localStorage.setItem(KEY(key), JSON.stringify(records))

      expect(checkAndRepairStoredData()).toEqual([{ category, outcome: 'cleaned' }])
      expect(JSON.parse(localStorage.getItem(KEY(key))!)).toHaveLength(kept)
    },
  )

  it('fixes only the bad settings, keeping the good ones', () => {
    localStorage.setItem(
      KEY('settings'),
      JSON.stringify({ animationsEnabled: false, difficulty: 'impossible', masteryThreshold: 99 }),
    )

    expect(checkAndRepairStoredData()).toEqual([{ category: 'settings', outcome: 'cleaned' }])
    expect(JSON.parse(localStorage.getItem(KEY('settings'))!)).toMatchObject({
      animationsEnabled: false,
      difficulty: DEFAULT_SETTINGS.difficulty,
      masteryThreshold: DEFAULT_SETTINGS.masteryThreshold,
    })
  })

  it('does not count older mistake records without mastery info as damage', () => {
    const legacy: Record<string, unknown> = { ...makePattern(7, 'multiplication', 8) }
    delete legacy.masteredAt
    localStorage.setItem(KEY('mistake-patterns'), JSON.stringify([legacy]))

    expect(checkAndRepairStoredData()).toEqual([])
  })

  it('reports several damaged categories at once, and remembers them for the startup notice', () => {
    localStorage.setItem(KEY('settings'), '{broken')
    localStorage.setItem(KEY('attempts'), JSON.stringify([goodAttempt, 'junk']))

    const repairs = checkAndRepairStoredData()

    expect(repairs).toEqual([
      { category: 'settings', outcome: 'reset' },
      { category: 'answers', outcome: 'cleaned' },
    ])
    expect(getStartupRepairs()).toEqual(repairs)
  })

  it('keeps checking the other categories if one check fails unexpectedly', () => {
    vi.mocked(parseSettings).mockImplementationOnce(() => {
      throw new Error('Unexpected')
    })
    localStorage.setItem(KEY('settings'), JSON.stringify(DEFAULT_SETTINGS))
    localStorage.setItem(KEY('attempts'), JSON.stringify([goodAttempt, 'junk']))

    expect(checkAndRepairStoredData()).toEqual([{ category: 'answers', outcome: 'cleaned' }])
  })

  it('never throws, even when storage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(() => checkAndRepairStoredData()).not.toThrow()
    expect(checkAndRepairStoredData()).toEqual([])
  })
})
