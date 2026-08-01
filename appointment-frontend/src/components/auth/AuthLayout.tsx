import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/utils'

interface AuthLayoutProps {
  leftPanel: ReactNode
  children: ReactNode
  rightAction?: ReactNode
  cardClassName?: string
}

export function AuthLayout({
  leftPanel,
  children,
  rightAction,
  cardClassName,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl w-full mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-card">
              <img
                src="/logo/logo_for_bg_light.png"
                alt="HILA"
                className="w-9 h-9 rounded-xl object-contain"
              />
            </div>
            <span className="font-display text-xl font-bold text-text">HILA</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Retour à l'accueil
            </Link>
            {rightAction}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full px-4 sm:px-6 py-10 lg:py-12">
          <div
            className={cn(
              'w-full rounded-3xl overflow-hidden shadow-card border border-border/60 bg-surface flex',
              cardClassName ?? 'max-w-5xl',
            )}
          >
            <div className="hidden lg:block lg:w-[45%] shrink-0">{leftPanel}</div>
            <div className="flex-1 min-w-0 bg-background">{children}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
