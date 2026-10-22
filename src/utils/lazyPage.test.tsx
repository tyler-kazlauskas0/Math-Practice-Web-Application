import { act, render, screen } from '@testing-library/react'
import { useState, type ComponentType } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lazyPage } from './lazyPage'

type PageModule = { default: ComponentType }

/** A page download the test finishes (or fails) when it chooses. */
function controlledDownload() {
  const download = {
    finish: () => {},
    fail: (() => {}) as (error: Error) => void,
    load: vi.fn(
      () =>
        new Promise<PageModule>((resolve, reject) => {
          download.finish = () => resolve({ default: () => <h1>Statistics</h1> })
          download.fail = reject
        }),
    ),
  }
  return download
}

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Clicked {count}</button>
}

afterEach(() => vi.restoreAllMocks())

describe('lazyPage', () => {
  it('downloads the page when it is first shown, with a loading message meanwhile', async () => {
    const download = controlledDownload()
    const Page = lazyPage(download.load)
    render(<Page />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(download.load).toHaveBeenCalledTimes(1)

    await act(async () => download.finish())
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
  })

  it('shows a preloaded page straight away, downloading it only once', async () => {
    const download = controlledDownload()
    const Page = lazyPage(download.load)
    const preloading = Page.preload()
    Page.preload()
    download.finish()
    await preloading

    render(<Page />)
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
    expect(download.load).toHaveBeenCalledTimes(1)
  })

  it('never remounts the page once it has loaded, so it keeps its state', async () => {
    let finish = () => {}
    const Page = lazyPage(
      () => new Promise<PageModule>((resolve) => (finish = () => resolve({ default: Counter }))),
    )
    const { rerender } = render(<Page />)
    await act(async () => finish())

    await act(async () => screen.getByRole('button').click())
    rerender(<Page />)
    expect(screen.getByRole('button')).toHaveTextContent('Clicked 1')
  })

  it('shows the error page if the download fails, and tries again next time', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const download = controlledDownload()
    const Page = lazyPage(download.load)
    const router = createMemoryRouter([
      { path: '/', element: <Page />, errorElement: <p>Couldn’t open the page</p> },
    ])
    const { unmount } = render(<RouterProvider router={router} />)

    await act(async () => download.fail(new Error('Offline')))
    expect(screen.getByText('Couldn’t open the page')).toBeInTheDocument()
    unmount()

    render(<Page />)
    expect(download.load).toHaveBeenCalledTimes(2)
    await act(async () => download.finish())
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
  })
})
