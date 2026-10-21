import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import QuestionProgress from '../question/QuestionProgress'
import SessionProgress from './SessionProgress'

describe('SessionProgress', () => {
  it('updates the bar as questions are answered', () => {
    const { rerender } = render(<SessionProgress answered={0} total={10} correct={0} />)
    const bar = screen.getByRole('progressbar', { name: 'Session progress' })

    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
    expect(bar).toHaveAttribute('aria-valuetext', '0 of 10 questions answered')

    rerender(<SessionProgress answered={3} total={10} correct={2} />)
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 10 questions answered')
    expect(bar.firstElementChild).toHaveStyle({ width: '30%' })
    expect(screen.getByText('3 of 10 answered')).toBeVisible()
  })

  it('is full at the end', () => {
    render(<SessionProgress answered={5} total={5} correct={5} />)

    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '100%' })
  })

  it('shows a running count, with no bar, in non-stop practice', () => {
    const { rerender } = render(<SessionProgress answered={1} total={null} correct={0} />)

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('1 question answered · 0 right')).toBeVisible()

    rerender(<SessionProgress answered={12} total={null} correct={9} />)
    expect(screen.getByText('12 questions answered · 9 right')).toBeVisible()
  })
})

describe('QuestionProgress', () => {
  it('shows the question number, and the total when there is one', () => {
    const { rerender } = render(<QuestionProgress questionNumber={3} totalQuestions={10} />)
    expect(screen.getByText('Question 3 of 10')).toBeVisible()

    rerender(<QuestionProgress questionNumber={14} totalQuestions={null} />)
    expect(screen.getByText('Question 14')).toBeVisible()
  })
})
