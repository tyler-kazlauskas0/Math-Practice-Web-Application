import { Outlet } from 'react-router'
import Header from './Header'
import './layout.css'

/** The shared frame around every page. The current page renders in place of `<Outlet />`. */
function AppLayout() {
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
