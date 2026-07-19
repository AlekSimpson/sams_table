// Shared component — primary/secondary/destructive/ghost action button.
import { ButtonHTMLAttributes, ReactNode } from 'react'
import './button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
export type ButtonSize = 'default' | 'small'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  full_width?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'default',
  full_width = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    size === 'small' ? 'button--small' : '',
    full_width ? 'button--full-width' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
