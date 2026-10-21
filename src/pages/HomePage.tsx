import { useLocation } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import ResumeSessionBanner from '../components/session/ResumeSessionBanner'
import '../components/session/session.css'
import ButtonLink from '../components/ui/ButtonLink'
import { DATA_CLEARED_REASON, ROUTES } from '../data/routes'
import './HomePage.css'

function HomePage() {
  const { state } = useLocation()
  const dataCleared = (state as { reason?: unknown } | null)?.reason === DATA_CLEARED_REASON

  return (
    <PageContainer>
      <section className="home">
        <ResumeSessionBanner />
        {dataCleared && (
          <p className="home__notice" role="status">
            All app data was deleted. Everything is back to the way it started.
          </p>
        )}
        <h1>
          Welcome to Math Practice! <span aria-hidden="true">👋</span>
        </h1>
        <p className="home__intro">
          Practice adding, subtracting, multiplying, and dividing. Pick what you want to do next.
        </p>
        <div className="home__actions">
          <ButtonLink to={ROUTES.practiceSetup}>Start Practice</ButtonLink>
          <ButtonLink to={ROUTES.statistics} variant="secondary">
            View Statistics
          </ButtonLink>
          <ButtonLink to={ROUTES.settings} variant="secondary">
            Settings
          </ButtonLink>
        </div>
      </section>
    </PageContainer>
  )
}

export default HomePage
