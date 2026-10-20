import PageContainer from '../components/layout/PageContainer'
import ButtonLink from '../components/ui/ButtonLink'
import { ROUTES } from '../data/routes'
import './HomePage.css'

function HomePage() {
  return (
    <PageContainer>
      <section className="home">
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
