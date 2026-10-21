import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const matches = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false

/** Whether the device asks for less motion. Updates if the setting changes while the app is open. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(matches)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(QUERY)
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}
