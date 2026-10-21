import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { withAppLayout } from '../routes'

function Broken(): never {
  throw new Error('TypeError: cannot read x of undefined at Card (Card.tsx:42:7)')
}

describe('when a page crashes', () => {
  afterEach(() => vi.restoreAllMocks())

  function renderBrokenPage() {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const router = createMemoryRouter(withAppLayout([{ path: '/', element: <Broken /> }]))
    render(<App router={router} />)
    return log
  }

  it('shows a friendly message with a way home, keeping the menu', () => {
    renderBrokenPage()

    const alert = screen.getByRole('alert')
    expect(within(alert).getByRole('heading', { level: 1 })).toHaveTextContent(
      'Oops! Something went wrong.',
    )
    expect(alert).toHaveTextContent(/not your fault/i)
    expect(within(alert).getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/')
    expect(within(alert).getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('never shows technical details to the player', () => {
    renderBrokenPage()

    expect(document.body).not.toHaveTextContent(
      /TypeError|undefined|\.tsx|Unexpected Application Error/,
    )
  })

  it('logs the details for developers instead', () => {
    const log = renderBrokenPage()

    expect(log).toHaveBeenCalledWith('[Math Practice] A page crashed', expect.any(Error))
  })
})
