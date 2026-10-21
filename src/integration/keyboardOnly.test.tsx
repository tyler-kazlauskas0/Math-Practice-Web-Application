import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { answerChoices, currentQuestion, openApp, valueNextTo, type User } from '../test/practice'

/**
 * Presses Tab until `target` has focus, failing if it can't be reached. This proves every
 * control used below is in the tab order, not just clickable.
 */
async function tabTo(user: User, target: HTMLElement) {
  for (let presses = 0; presses < 60 && document.activeElement !== target; presses++) {
    await user.tab()
  }
  expect(target).toHaveFocus()
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })

describe('keyboard only', () => {
  it('completes a whole session, from home to statistics, without a mouse', async () => {
    const { user } = openApp('/')

    await tabTo(user, screen.getByRole('link', { name: 'Start Practice' }))
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()

    // Operations are checkboxes (Space toggles); levels and lengths are radio groups (arrows).
    await tabTo(user, screen.getByRole('checkbox', { name: 'Subtraction' }))
    await user.keyboard(' ')
    await tabTo(user, screen.getByRole('radio', { name: 'Easy' }))
    await user.keyboard('{ArrowLeft}')
    await tabTo(user, screen.getByRole('radio', { name: '10 questions' }))
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '5 questions' })).toBeChecked()

    await tabTo(user, button('Start Session'))
    await user.keyboard('{Enter}')

    for (let i = 0; i < 5; i++) {
      // Number keys 1–4 choose an answer; then Tab and Enter or Space do the rest.
      const { answer } = currentQuestion()
      const index = answerChoices().findIndex(({ value }) => value === answer)
      await user.keyboard(String(index + 1))
      expect(answerChoices()[index].button).toHaveAttribute('aria-pressed', 'true')

      await tabTo(user, button('Flip Card'))
      await user.keyboard('{Enter}')
      await tabTo(user, button(i === 2 ? 'I Got It Wrong' : 'I Got It Right'))
      await user.keyboard(' ')
      await tabTo(user, button(/^(Next Question|Finish)$/))
      await user.keyboard('{Enter}')
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Great Practice!' })).toBeInTheDocument()
    expect(valueNextTo(screen.getByRole('main'), 'Right')).toBe('4')

    await tabTo(user, screen.getByRole('link', { name: 'View Statistics' }))
    await user.keyboard('{Enter}')
    expect(valueNextTo(screen.getByLabelText('Overall results'), 'Questions')).toBe('5')
  })

  it('can leave a session from the menu and choose to keep practicing', async () => {
    const { user } = openApp('/')
    await tabTo(user, screen.getByRole('link', { name: 'Start Practice' }))
    await user.keyboard('{Enter}')
    await tabTo(user, button('Start Session'))
    await user.keyboard('{Enter}')
    await user.keyboard('1')
    await tabTo(user, button('Flip Card'))
    await user.keyboard('{Enter}')
    await tabTo(user, button('I Got It Right'))
    await user.keyboard('{Enter}')

    await tabTo(user, screen.getByRole('link', { name: 'Statistics' }))
    await user.keyboard('{Enter}')
    // The safe choice has focus, so Enter keeps the session going.
    expect(button('Keep Practicing')).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
