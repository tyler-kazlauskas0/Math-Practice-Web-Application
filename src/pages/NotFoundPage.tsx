import PageContainer from '../components/layout/PageContainer'
import ButtonLink from '../components/ui/ButtonLink'
import { ROUTES } from '../data/routes'

function NotFoundPage() {
  return (
    <PageContainer title="Page not found">
      <p>Oops! We couldn’t find that page.</p>
      <ButtonLink to={ROUTES.home}>Go to Home</ButtonLink>
    </PageContainer>
  )
}

export default NotFoundPage
