import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MistakePatternsProvider from '../components/MistakePatternsProvider'
import SettingsProvider from '../components/SettingsProvider'
import { useStatistics } from '../hooks/useStatistics'
import { useSettings } from '../hooks/useSettings'
import { saveAttempt, saveSession } from '../services/practiceHistory'
import { makeQuestion } from '../test/makeQuestion'
import { openApp } from '../test/practice'
import { generatePracticeQuestion } from '../utils/questions/generateQuestion'
import { speakQuestion } from '../utils/questions/spokenText'
import { calculateStatistics } from '../utils/statistics'

// Spied on (still working as normal) to count how often they run.
vi.mock('../utils/questions/generateQuestion', { spy: true })
vi.mock('../utils/questions/spokenText', { spy: true }) // Called once per render of the card front.
vi.mock('../utils/statistics', { spy: true })
vi.mock('../services/practiceHistory', { spy: true })

const session = { operations: ['addition'], difficulty: 'easy', sessionLength: 5 }

// Each test counts calls from zero.
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('practice session rendering', () => {
  it('makes questions only when moving on, never while rendering', async () => {
    const { user } = openApp('/practice/session', { state: session })
    const madeAtStart = vi.mocked(generatePracticeQuestion).mock.calls.length
    expect(madeAtStart).toBeGreaterThanOrEqual(1)

    // Choosing, changing, flipping, and marking all re-render, but make no questions.
    await user.keyboard('1')
    await user.keyboard('2')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(generatePracticeQuestion).toHaveBeenCalledTimes(madeAtStart)

    await user.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(vi.mocked(generatePracticeQuestion).mock.calls.length).toBeGreaterThan(madeAtStart)
  })

  it('saves each answer once: moving to the next question saves nothing', async () => {
    const { user } = openApp('/practice/session', { state: session })
    for (let i = 0; i < 3; i++) {
      await user.keyboard('1')
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
      await user.click(screen.getByRole('button', { name: 'Next Question' }))
    }

    // With thousands of answers saved, every save reads and rewrites all of them.
    expect(saveAttempt).toHaveBeenCalledTimes(3)
    expect(saveSession).toHaveBeenCalledTimes(3)
  })

  it('adds the number-key listener once per card, not on every render', async () => {
    const listen = vi.spyOn(window, 'addEventListener')
    const { user } = openApp('/practice/session', { state: session })
    for (const key of ['1', '2', '3', '4', '1']) await user.keyboard(key)

    expect(listen.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
  })

  it('does not re-render the hidden front of the card while the back changes', async () => {
    const { user } = openApp('/practice/session', { state: session })
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    vi.mocked(speakQuestion).mockClear()

    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await user.click(screen.getByRole('link', { name: 'Statistics' })) // Opens the leave warning.
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))

    expect(speakQuestion).not.toHaveBeenCalled()
  })
})

describe('statistics page', () => {
  it('works out the statistics once per visit, not on every render', () => {
    saveAttempt({
      sessionId: 's1',
      question: makeQuestion(2, 'addition', 3),
      userAnswer: 5,
      isCorrect: true,
      timeTakenMs: 1000,
      answeredAt: '2026-10-21T10:00:00.000Z',
    })
    saveSession({
      id: 's1',
      config: { operations: ['addition'], difficulty: 'easy', sessionLength: 5 },
      isReview: false,
      startedAt: '2026-10-21T10:00:00.000Z',
      completedAt: null,
      totalAttempts: 1,
      correctAttempts: 1,
    })
    vi.mocked(calculateStatistics).mockClear()
    const { rerender } = renderHook(() => useStatistics(), {
      wrapper: ({ children }) => (
        <SettingsProvider>
          <MistakePatternsProvider>{children}</MistakePatternsProvider>
        </SettingsProvider>
      ),
    })
    rerender()
    rerender()
    expect(calculateStatistics).toHaveBeenCalledTimes(1)
  })
})

describe('settings updates', () => {
  function renderSettings() {
    const renders = { count: 0 }
    let api: ReturnType<typeof useSettings> | null = null
    function Consumer() {
      renders.count++
      api = useSettings()
      return null
    }
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>,
    )
    return { renders, api: () => api! }
  }

  it('does not save anything just because the app started', () => {
    renderSettings()
    expect(localStorage.getItem('math-practice:settings')).toBeNull()
  })

  it('ignores changes that set the same value: no re-render and no save', () => {
    const { renders, api } = renderSettings()
    const before = renders.count
    const update = api().updateSettings

    act(() => api().updateSettings({ soundEnabled: true, enabledOperations: ['addition'] }))
    act(() => api().resetSettings())

    expect(renders.count).toBe(before)
    expect(localStorage.getItem('math-practice:settings')).toBeNull()
    expect(api().updateSettings).toBe(update)
  })

  it('applies and saves real changes', () => {
    const { renders, api } = renderSettings()
    const before = renders.count

    act(() => api().updateSettings({ soundEnabled: false }))

    expect(renders.count).toBe(before + 1)
    expect(api().settings.soundEnabled).toBe(false)
    expect(JSON.parse(localStorage.getItem('math-practice:settings')!)).toMatchObject({
      soundEnabled: false,
    })
  })
})
