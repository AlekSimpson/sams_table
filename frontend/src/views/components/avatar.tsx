// Shared component — circular initials avatar, with an optional corner badge (e.g. level).
import { ReactNode } from 'react'
import './avatar.css'

export type AvatarSize = 'small' | 'medium' | 'large'

interface AvatarProps {
  label: string
  size?: AvatarSize
  badge?: ReactNode
  className?: string
}

export default function Avatar({ label, size = 'medium', badge, className }: AvatarProps) {
  const classes = ['avatar', `avatar--${size}`, className ?? ''].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      <span className="avatar__label">{label}</span>
      {badge !== undefined && badge !== null && <span className="avatar__badge">{badge}</span>}
    </div>
  )
}
