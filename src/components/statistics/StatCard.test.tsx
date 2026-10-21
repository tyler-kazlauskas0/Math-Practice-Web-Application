import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../../test/makeQuestion'
import { tallyAttempts } from '../../utils/statistics'
import StatTiles from '../ui/StatTiles'
import StatCard from './StatCard'

const stats = (total: number, correct: number) => ({
  totalAttempts: total,
  correctAttempts: correct,
  incorrectAttempts: total - correct,
  accuracy: total === 0 ? 0 : correct / total,
  averageTimeMs: 0,
})

/** The value shown for a label in a description list, e.g. "Right" → "7". */
const valueOf = (container: HTMLElement, label: string) =>
  within(container).getByText(label).nextElementSibling?.textContent

describe('StatCard', () => {
  it('is a labelled card with accuracy and the attempted, right, and wrong counts', () => {
    render(
      <StatCard title="Multiplication" icon="×" description="Times tables" stats={stats(8, 6)} />,
    )
    const card = screen.getByRole('article', { name: 'Multiplication' })

    expect(within(card).getByText('75%')).toBeVisible()
    expect(valueOf(card, 'Attempted')).toBe('8')
    expect(valueOf(card, 'Right')).toBe('6')
    expect(valueOf(card, 'Wrong')).toBe('2')
    expect(card).toHaveTextContent('Times tables')
  })

  it('fills the accuracy meter to match', () => {
    const { container } = render(<StatCard title="Addition" stats={stats(4, 1)} />)

    expect(container.querySelector('.stat-card__meter-fill')).toHaveStyle({ width: '25%' })
  })

  it('says "Not practiced yet" instead of showing zeros', () => {
    render(<StatCard title="Division" stats={stats(0, 0)} />)
    const card = screen.getByRole('article', { name: 'Division' })

    expect(card).toHaveTextContent('Not practiced yet')
    expect(within(card).queryByText('0%')).not.toBeInTheDocument()
  })

  it('rounds accuracy to a whole percent', () => {
    render(<StatCard title="Subtraction" stats={stats(3, 2)} />)

    expect(screen.getByText('67%')).toBeVisible()
  })

  it('shows the numbers worked out from real attempts', () => {
    const attempt = (isCorrect: boolean) => ({
      question: makeQuestion(2, 'addition', 3),
      userAnswer: isCorrect ? 5 : 6,
      isCorrect,
      timeTakenMs: 1000,
      answeredAt: '2026-10-21T10:00:00.000Z',
    })
    const tally = tallyAttempts([attempt(true), attempt(true), attempt(false)])
    render(<StatCard title="Mixed" stats={tally} />)

    expect(screen.getByText('67%')).toBeVisible()
    expect(valueOf(screen.getByRole('article'), 'Wrong')).toBe('1')
  })
})

describe('StatTiles', () => {
  it('pairs each label with its value', () => {
    const { container } = render(
      <StatTiles
        label="Totals"
        tiles={[
          { label: 'Questions', value: 10 },
          { label: 'Accuracy', value: '80%' },
        ]}
      />,
    )

    expect(screen.getByLabelText('Totals')).toBeVisible()
    expect(valueOf(container, 'Questions')).toBe('10')
    expect(valueOf(container, 'Accuracy')).toBe('80%')
  })
})
