import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import App from '../App'
import { appRoutes } from '../routes'

export type User = ReturnType<typeof userEvent.setup>

/**
 * Opens the whole app at `path`. Opening it again with the same `key` acts like refreshing
 * that browser tab: everything is rebuilt from what was saved.
 */
export function openApp(path = '/', { state, key }: { state?: unknown; key?: string } = {}) {
  const user = userEvent.setup()
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [{ pathname: path, state, key }],
  })
  const view = render(<App router={router} />)
  return { user, router, ...view }
}

const SOLVE: Record<string, (a: number, b: number) => number> = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
}

/** The question on the card, e.g. `{ left: 7, symbol: '×', right: 8, answer: 56 }`. */
export function currentQuestion() {
  const text = screen.getByRole('heading', { level: 2 }).textContent!.replace(' = ?', '')
  const [left, symbol, right] = text.split(' ')
  return { text, symbol, answer: SOLVE[symbol](Number(left), Number(right)) }
}

/** The number an answer button stands for: its last bit of text, after any hidden labels. */
export const answerValue = (button: HTMLElement) => Number(button.lastChild!.textContent)

/** The answer buttons, with the number each one stands for. */
export function answerChoices() {
  return screen
    .getAllByRole('button', { name: /^Answer / })
    .map((button) => ({ button, value: answerValue(button) }))
}

/** Picks the right answer (or a wrong one), flips the card, marks it honestly, and moves on. */
export async function answerQuestion(user: User, getItRight: boolean) {
  const { answer } = currentQuestion()
  const choice = answerChoices().find(({ value }) => (value === answer) === getItRight)!
  await user.click(choice.button)
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: getItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  )
  await user.click(screen.getByRole('button', { name: /^(Next Question|Finish)$/ }))
}

/** The value next to a label in a list of results, e.g. "Right" → "7". */
export const valueNextTo = (container: HTMLElement, label: string) =>
  [...container.querySelectorAll('dt')].find((dt) => dt.textContent === label)?.nextElementSibling
    ?.textContent
