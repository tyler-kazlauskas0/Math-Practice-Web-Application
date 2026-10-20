import { Link } from 'react-router'
import { ROUTES } from '../../data/routes'
import Navigation from './Navigation'

/** The app header: title and main navigation, shown on every page. */
function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to={ROUTES.home} className="app-header__title">
          <span aria-hidden="true">🧮</span> Math Practice
        </Link>
        <Navigation />
      </div>
    </header>
  )
}

export default Header
