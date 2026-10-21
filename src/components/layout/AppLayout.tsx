import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from './Header'
import './layout.css'

/** The shared frame around every page. The current page renders in place of `<Outlet />`. */
function AppLayout() {
  const { pathname } = useLocation()

  // Each page opens at the top, instead of keeping the previous page's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <Outlet />
    </>
  )
}

export default AppLayout
