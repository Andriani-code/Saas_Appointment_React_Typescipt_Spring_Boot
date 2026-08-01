import { HTMLAttributes, ReactNode } from 'react'
import { cn, getInitials } from '@/utils'
import type { ReservationStatus } from '@/types'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ hover = false, padding = 'md', className, children, ...props }: CardProps) {
  const paddingClass = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }[padding]
  return (
    <div
      className={cn(hover ? 'card-hover' : 'card', paddingClass, className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface BadgeProps {
  status: ReservationStatus
  label?: string
  dot?: boolean
}

const statusConfig: Record<ReservationStatus, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-warning/15 text-warning-300', dot: 'bg-warning' },
  CONFIRMED: { label: 'Confirmé', cls: 'bg-primary/15 text-primary-300', dot: 'bg-primary' },
  COMPLETED: { label: 'Terminé', cls: 'bg-success/15 text-success-300', dot: 'bg-success' },
  CANCELED: { label: 'Annulé', cls: 'bg-muted/10 text-muted', dot: 'bg-muted' },
  REJECTED: { label: 'Rejeté', cls: 'bg-danger/15 text-danger-300', dot: 'bg-danger' },
  NO_SHOW: { label: 'Absent', cls: 'bg-muted/10 text-muted', dot: 'bg-muted' },
}

export function StatusBadge({ status, label, dot = true }: BadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span className={cn('badge', cfg.cls)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />}
      {label ?? cfg.label}
    </span>
  )
}

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <div className={cn(
      'rounded-full overflow-hidden shrink-0 flex items-center justify-center',
      'bg-primary/15 text-primary font-semibold',
      avatarSizes[size],
      className,
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-primary', className)}
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function EmptyState({ icon, title, description, action, className }: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-4 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-text">{title}</p>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StarRating({ rating, max = 5, size = 14 }: { rating?: number | null; max?: number; size?: number }) {
  if (rating === undefined || rating === null) return null;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            fill={i < Math.round(rating) ? '#C4781B' : '#E8E8E8'}
          />
        </svg>
      ))}
      <span className="text-xs text-muted ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
