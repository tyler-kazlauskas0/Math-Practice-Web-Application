import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

/** A native `<button>` with the app's shared button style. */
function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ')

  return <button type={type} className={classes} {...props} />
}

export default Button
