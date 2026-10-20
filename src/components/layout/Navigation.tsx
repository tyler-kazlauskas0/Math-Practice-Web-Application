import { Link, matchPath, useLocation } from 'react-router'
import { ROUTES } from '../../data/routes'

const NAV_ITEMS = [
  { label: 'Home', to: ROUTES.home, activePattern: ROUTES.home },
  { label: 'Practice', to: ROUTES.practiceSetup, activePattern: '/practice/*' },
  { label: 'Statistics', to: ROUTES.statistics, activePattern: ROUTES.statistics },
  { label: 'Settings', to: ROUTES.settings, activePattern: ROUTES.settings },
]

/** The main site navigation. The link for the current section is marked with `aria-current`. */
function Navigation() {
  const { pathname } = useLocation()

  return (
    <nav className="main-nav" aria-label="Main">
      <ul className="main-nav__list">
        {NAV_ITEMS.map(({ label, to, activePattern }) => {
          const isActive = matchPath(activePattern, pathname) !== null

          return (
            <li key={to}>
              <Link to={to} className="main-nav__link" aria-current={isActive ? 'page' : undefined}>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Navigation
