import { ReactNode } from 'react'
import { cn } from '@/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title:   string
  value:   string | number
  icon:    ReactNode
  trend?:  number   // percent, positive = up
  color?:  'orange' | 'blue' | 'green' | 'purple'
  delay?:  number
}

const colors = {
  orange: { bg: 'bg-primary/10',  icon: 'text-primary',   val: 'text-primary' },
  blue:   { bg: 'bg-blue-50',     icon: 'text-blue-600',  val: 'text-blue-700' },
  green:  { bg: 'bg-green-50',    icon: 'text-green-600', val: 'text-green-700' },
  purple: { bg: 'bg-violet-50',   icon: 'text-violet-600',val: 'text-violet-700' },
}

export function StatCard({ title, value, icon, trend, color = 'orange', delay = 0 }: StatCardProps) {
  const c = colors[color]
  const trendUp = trend !== undefined && trend >= 0

  return (
    <div
      className="card p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', c.bg)}>
          <span className={c.icon}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          )}>
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm text-muted mb-1">{title}</p>
      <p className={cn('text-3xl font-display font-bold', c.val)}>{value}</p>
      {trend !== undefined && (
        <p className="text-xs text-muted mt-1.5">
          {trendUp ? '↑ en hausse' : '↓ en baisse'} la semaine dernière
        </p>
      )}
    </div>
  )
}
