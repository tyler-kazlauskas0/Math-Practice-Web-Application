import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AnswerChoice from './AnswerChoice'

describe('AnswerChoice', () => {
  it('is a button labelled with its answer', () => {
    render(<AnswerChoice value={56} isSelected={false} isLocked={false} onSelect={() => {}} />)

    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveTextContent('56')
  })

  it('reports whether it is selected', () => {
    const { rerender } = render(
      <AnswerChoice value={56} isSelected={false} isLocked={false} onSelect={() => {}} />,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')

    rerender(<AnswerChoice value={56} isSelected isLocked={false} onSelect={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button')).toHaveClass('answer-choice--selected')
  })

  it('calls onSelect with its value when clicked or activated with the keyboard', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AnswerChoice value={56} isSelected={false} isLocked={false} onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledTimes(3)
    expect(onSelect).toHaveBeenCalledWith(56)
  })

  it('cannot be changed once locked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AnswerChoice value={56} isSelected={false} isLocked onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toBeDisabled()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
