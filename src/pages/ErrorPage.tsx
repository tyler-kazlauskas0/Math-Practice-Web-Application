import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import { logDevError } from '../utils/devLog'

/**
 * Shown when a page crashes. Replaces React Router's built-in error screen, which shows
 * technical details. The details go to the developer console instead.
 */
function ErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    logDevError('A page crashed', error)
  }, [error])

  return (
    <PageContainer>
      <ErrorMessage
        title="Oops! Something went wrong."
        headingLevel="h1"
        actions={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        }
      >
        <p>This page had a problem and couldn’t open. It’s not your fault!</p>
        <p>Your saved practice and settings are safe. Try again, or go back home.</p>
      </ErrorMessage>
    </PageContainer>
  )
}

export default ErrorPage
