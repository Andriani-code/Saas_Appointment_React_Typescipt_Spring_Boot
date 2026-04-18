import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Calendar, Users, MessageSquare,
  Star, Settings, LogOut, ChevronRight,
  Stethoscope, UserCog, Shield,
} from 'lucide-react'

interface NavItem {
  to:    string
  icon:  ReactNode
  label: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { to: '/appointments',  icon: <Calendar size={18} />,        label: 'Mes rendez-vous' },
  { to: '/specialists',   icon: <Stethoscope size={18} />,     label: 'Spécialistes',   roles: ['CLIENT'] },
  { to: '/patients',      icon: <Users size={18} />,           label: 'Patients',       roles: ['SPECIALIST'] },
  { to: '/services',      icon: <UserCog size={18} />,         label: 'Mes services',   roles: ['SPECIALIST'] },
  { to: '/messages',      icon: <MessageSquare size={18} />,   label: 'Messages' },
  { to: '/reviews',       icon: <Star size={18} />,            label: 'Avis' },
  { to: '/admin',         icon: <Shield size={18} />,          label: 'Administration', roles: ['ADMIN'] },
  { to: '/settings',      icon: <Settings size={18} />,        label: 'Paramètres' },
]

interface SidebarProps {
  children: ReactNode
}

export function MainLayout({ children }: SidebarProps) {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(item =>
    !item.roles || item.roles.some(r => hasRole(r as 'ADMIN' | 'CLIENT' | 'SPECIALIST'))
  )

  const displayName = user?.email?.split('@')[0] ?? 'Utilisateur'
  const roleLabel = { ADMIN: 'Administrateur', CLIENT: 'Patient', SPECIALIST: 'Spécialiste' }[user?.role ?? 'CLIENT']

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col shadow-sm">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                  fill="white" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-text">BookDoc</span>
          </div>
        </div>

        {/* Profile */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-soft transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text truncate capitalize">{displayName}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
            <ChevronRight size={14} className="text-muted shrink-0" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('sidebar-link', isActive && 'sidebar-link-active')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-danger hover:bg-red-50 hover:text-danger"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted/50 pb-3">© 2024 BookDoc</p>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
