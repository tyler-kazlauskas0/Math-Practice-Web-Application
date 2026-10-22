import { useEffect, useState, type ComponentType } from 'react'

/**
 * A page whose code is downloaded only when it's first needed, keeping the app's first
 * download small. Call `preload()` to download it ahead of time (the app does this in the
 * background once the first page is showing), so it's usually ready before it's opened.
 *
 * Until the code arrives, a short loading message is shown. If it can't be downloaded (e.g.
 * the connection dropped), the error is thrown so the friendly error page appears, and the
 * next visit tries again.
 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  let Page: ComponentType | null = null
  let loading: Promise<void> | null = null

  function preload(): Promise<void> {
    loading ??= load().then(
      (module) => {
        Page = module.default
      },
      (error: unknown) => {
        loading = null
        throw error
      },
    )
    return loading
  }

  function LazyPage() {
    const [, setLoaded] = useState(false)
    const [error, setError] = useState<{ cause: unknown } | null>(null)

    useEffect(() => {
      if (Page) return
      preload().then(
        () => setLoaded(true),
        (cause) => setError({ cause }),
      )
    }, [])

    if (error) throw error.cause
    // Once loaded, this is always the same component, so the page is never remounted.
    return Page ? (
      <Page />
    ) : (
      <p className="page-loading" role="status">
        Loading…
      </p>
    )
  }

  LazyPage.preload = preload
  return LazyPage
}
