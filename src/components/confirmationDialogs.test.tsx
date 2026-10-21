import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EndSessionControl from './session/EndSessionControl'
import LeaveSessionDialog from './session/LeaveSessionDialog'
import ClearAllData from './settings/ClearAllData'
import ResetStatistics from './statistics/ResetStatistics'

/**
 * The dialogs that open from a button share the same rules: focus moves into the dialog,
 * Escape and Cancel close it without doing anything, and focus goes back to the button.
 */
describe.each([
  {
    name: 'End Session',
    renderDialog: (onConfirm: () => void) =>
      render(<EndSessionControl answered={3} onEnd={onConfirm} />),
    open: 'End Session',
    title: 'End this session?',
    focusedFirst: () => screen.getByRole('button', { name: 'Yes, End Session' }),
    cancel: 'Keep Practicing',
    confirm: async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Yes, End Session' }))
    },
  },
  {
    name: 'Reset Statistics',
    renderDialog: (onConfirm: () => void) => render(<ResetStatistics onReset={onConfirm} />),
    open: 'Reset Statistics',
    title: 'Delete all practice history?',
    focusedFirst: () => screen.getByRole('checkbox', { name: /I understand/ }),
    cancel: 'Cancel',
    confirm: async () => {
      await userEvent.click(screen.getByRole('checkbox', { name: /I understand/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Delete Everything' }))
    },
  },
  {
    name: 'Clear All Application Data',
    renderDialog: (onConfirm: () => void) => render(<ClearAllData onClear={onConfirm} />),
    open: 'Clear All Application Data',
    title: 'Delete everything?',
    focusedFirst: () => screen.getByRole('textbox', { name: /Type DELETE/ }),
    cancel: 'Cancel',
    confirm: async () => {
      await userEvent.type(screen.getByRole('textbox', { name: /Type DELETE/ }), 'delete')
      await userEvent.click(screen.getByRole('button', { name: 'Delete Everything' }))
    },
  },
])('$name confirmation', ({ renderDialog, open, title, focusedFirst, cancel, confirm }) => {
  it('opens a labelled dialog and moves focus into it', async () => {
    renderDialog(vi.fn())
    await userEvent.click(screen.getByRole('button', { name: open }))

    expect(screen.getByRole('alertdialog', { name: title })).toHaveAccessibleDescription()
    expect(focusedFirst()).toHaveFocus()
  })

  it.each([
    ['Escape', () => userEvent.keyboard('{Escape}')],
    ['the cancel button', () => userEvent.click(screen.getByRole('button', { name: cancel }))],
  ])('closes with %s, does nothing, and returns focus', async (_, close) => {
    const onConfirm = vi.fn()
    renderDialog(onConfirm)
    await userEvent.click(screen.getByRole('button', { name: open }))
    await close()

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: open })).toHaveFocus()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('does the action once confirmed', async () => {
    const onConfirm = vi.fn()
    renderDialog(onConfirm)
    await userEvent.click(screen.getByRole('button', { name: open }))
    await confirm()

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

describe('End Session', () => {
  it('ends straight away when nothing has been answered', async () => {
    const onEnd = vi.fn()
    render(<EndSessionControl answered={0} onEnd={onEnd} />)
    await userEvent.click(screen.getByRole('button', { name: 'End Session' }))

    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('says how many questions were answered', async () => {
    render(<EndSessionControl answered={1} onEnd={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'End Session' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent('You’ve answered 1 question.')
  })
})

describe('Reset Statistics and Clear All Data need a deliberate second step', () => {
  it('keeps Delete disabled until "I understand" is ticked, and forgets the tick on cancel', async () => {
    render(<ResetStatistics onReset={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    const deleteButton = screen.getByRole('button', { name: 'Delete Everything' })

    expect(deleteButton).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox'))
    expect(deleteButton).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it.each([
    ['nothing', '', false],
    ['the wrong word', 'REMOVE', false],
    ['part of the word', 'DELE', false],
    ['DELETE', 'DELETE', true],
    ['lowercase delete, with spaces', '  delete ', true],
  ])('Clear All Data with %s typed: enabled is %s', async (_, typed, enabled) => {
    const onClear = vi.fn()
    render(<ClearAllData onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
    if (typed) await userEvent.type(screen.getByRole('textbox'), typed)

    expect(screen.getByRole('button', { name: 'Delete Everything' })).toHaveProperty(
      'disabled',
      !enabled,
    )
    // Enter submits the form, but only works once the word is right.
    await userEvent.type(screen.getByRole('textbox'), '{Enter}')
    expect(onClear).toHaveBeenCalledTimes(enabled ? 1 : 0)
  })
})

describe('LeaveSessionDialog', () => {
  it('focuses the safe choice, so a stray Enter keeps practicing', async () => {
    const onStay = vi.fn()
    const onLeave = vi.fn()
    render(<LeaveSessionDialog answered={4} onStay={onStay} onLeave={onLeave} />)

    expect(
      screen.getByRole('alertdialog', { name: 'Leave this practice session?' }),
    ).toHaveTextContent('You’ve answered 4 questions.')
    expect(screen.getByRole('button', { name: 'Keep Practicing' })).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(onStay).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()
  })

  it('stays with Escape and leaves only with End Session and Leave', async () => {
    const onStay = vi.fn()
    const onLeave = vi.fn()
    render(<LeaveSessionDialog answered={1} onStay={onStay} onLeave={onLeave} />)

    await userEvent.keyboard('{Escape}')
    expect(onStay).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'End Session and Leave' }))
    expect(onLeave).toHaveBeenCalledTimes(1)
  })
})
