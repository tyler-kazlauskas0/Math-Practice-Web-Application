import type { ReactNode } from 'react'
import { ROUTES } from '../../data/routes'
import ButtonLink from './ButtonLink'
import './errorMessage.css'

interface ErrorMessageProps {
  title: string
  /** What happened and what to do, in plain words. Never technical details. */
  children: ReactNode
  /** Extra buttons, shown before Go Home. */
  actions?: ReactNode
  /** Use `h1` when the message is the whole page. */
  headingLevel?: 'h1' | 'h2'
}

/** A friendly explanation of something that went wrong, always with a safe way home. */
function ErrorMessage({ title, children, actions, headingLevel = 'h2' }: ErrorMessageProps) {
  const Heading = headingLevel

  return (
    <div className="error-message" role="alert">
      <span className="error-message__icon" aria-hidden="true">
        🧭
      </span>
      <Heading className="error-message__title">{title}</Heading>
      <div className="error-message__body">{children}</div>
      <div className="error-message__actions">
        {actions}
        {/* A plain link, so it works even if the app itself is in trouble. */}
        <ButtonLink to={ROUTES.home} reloadDocument>
          Go Home
        </ButtonLink>
      </div>
    </div>
  )
}

export default ErrorMessage
