import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { DifficultyLevel, MathOperation } from '../../types/question'
import DifficultySelector from './DifficultySelector'
import OperationSelector from './OperationSelector'

/** Renders a selector that keeps its own state, like the setup page does. */
function Operations({
  initial = [],
  onChange = () => {},
}: {
  initial?: MathOperation[]
  onChange?: (operations: MathOperation[]) => void
}) {
  const [selected, setSelected] = useState(initial)
  return (
    <OperationSelector
      selected={selected}
      onChange={(next) => {
        setSelected(next)
        onChange(next)
      }}
    />
  )
}

function Difficulty({ onChange = () => {} }: { onChange?: (level: DifficultyLevel) => void }) {
  const [value, setValue] = useState<DifficultyLevel>('easy')
  return (
    <DifficultySelector
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

describe('OperationSelector', () => {
  it('is a labelled group of checkboxes showing the current selection', () => {
    render(<Operations initial={['subtraction']} />)

    expect(screen.getByRole('group', { name: 'What do you want to practice?' })).toBeVisible()
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked()
  })

  it('adds and removes operations, always in the order they are shown', async () => {
    const onChange = vi.fn()
    render(<Operations onChange={onChange} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Division' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Addition' }))
    expect(onChange).toHaveBeenLastCalledWith(['addition', 'division'])

    await userEvent.click(screen.getByRole('checkbox', { name: 'Division' }))
    expect(onChange).toHaveBeenLastCalledWith(['addition'])
  })

  it('selects all, then clears all, with the shortcut button', async () => {
    const onChange = vi.fn()
    render(<Operations initial={['addition']} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onChange).toHaveBeenLastCalledWith([
      'addition',
      'subtraction',
      'multiplication',
      'division',
    ])

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(screen.getByRole('button', { name: 'Select all' })).toBeVisible()
  })

  it('works with Tab and Space', async () => {
    render(<Operations />)

    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toHaveFocus()
    await userEvent.keyboard(' ')
    await userEvent.tab()
    await userEvent.keyboard(' ')

    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked()
  })
})

describe('DifficultySelector', () => {
  it('is a labelled group of four radio buttons, each with a description', () => {
    render(<Difficulty />)

    expect(screen.getByRole('group', { name: 'How hard?' })).toBeVisible()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    radios.forEach((radio) => expect(radio).toHaveAccessibleDescription(/Numbers up to/))
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked()
  })

  it('allows only one level at a time', async () => {
    const onChange = vi.fn()
    render(<Difficulty onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Advanced' }))

    expect(onChange).toHaveBeenLastCalledWith('advanced')
    expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Easy' })).not.toBeChecked()
  })

  it('can be changed with the arrow keys', async () => {
    const onChange = vi.fn()
    render(<Difficulty onChange={onChange} />)

    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Easy' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')

    expect(onChange).toHaveBeenLastCalledWith('intermediate')
    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked()
  })
})
