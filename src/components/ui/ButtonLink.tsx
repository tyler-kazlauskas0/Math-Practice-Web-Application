import { Link, type LinkProps } from 'react-router'
import type { ButtonVariant } from './Button'

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
}

/** A navigation link that looks like a button. Use it for buttons that go to another page. */
function ButtonLink({ variant = 'primary', className, ...props }: ButtonLinkProps) {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ')

  return <Link className={classes} {...props} />
}

export default ButtonLink
