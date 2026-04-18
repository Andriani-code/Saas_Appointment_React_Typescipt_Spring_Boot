import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Users, DollarSign, Clock,
  ChevronRight, ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { reservationApi, specialistApi } from '@/services/api'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge, Avatar, Spinner, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { formatDate, formatTime } from '@/utils'
import type { ReservationResponse } from '@/types'

export function DashboardPage() {
  const { user, hasRole } = useAuth()
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (hasRole('CLIENT')) {
          const data = await reservationApi.getMyAsClient(0, 5)
          setReservations(data.content)
        } else if (hasRole('SPECIALIST')) {
          const data = await reservationApi.getMyAsSpecialist(0, 5)
          setReservations(data.content)
        }
      } catch { /* no-op */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [hasRole])

  const displayName = user?.email?.split('@')[0] ?? 'Utilisateur'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const stats = [
    { title: 'Rendez-vous totaux', value: reservations.length,
      icon: <Calendar size={20} />, trend: 5.9,   color: 'orange' as const },
    { title: 'Confirmés',
      value: reservations.filter(r => r.status === 'CONFIRMED').length,
      icon: <Clock size={20} />,    trend: 2.1,   color: 'blue' as const },
    { title: 'Terminés',
      value: reservations.filter(r => r.status === 'COMPLETED').length,
      icon: <Users size={20} />,    trend: -1.4,  color: 'green' as const },
    { title: 'En attente',
      value: reservations.filter(r => r.status === 'PENDING').length,
      icon: <DollarSign size={20} />, trend: 8.2, color: 'purple' as const },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">
            {greeting}, <span className="text-primary capitalize">{displayName}</span> 👋
          </h1>
          <p className="text-muted mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {hasRole('CLIENT') && (
          <Link to="/specialists">
            <Button icon={<Calendar size={16} />} iconRight={<ArrowRight size={14} />}>
              Prendre rendez-vous
            </Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} delay={i * 80} />
        ))}
      </div>

      {/* Recent appointments table */}
      <div className="card p-0 overflow-hidden animate-slide-up animation-delay-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="section-title">Activité récente</h2>
            <p className="text-sm text-muted mt-0.5">Vos derniers rendez-vous</p>
          </div>
          <Link to="/appointments">
            <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
              Voir tout
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="Aucun rendez-vous pour l'instant"
            description={hasRole('CLIENT') ? "Réservez votre premier rendez-vous" : "Vos réservations apparaîtront ici"}
            action={hasRole('CLIENT') ? (
              <Link to="/specialists">
                <Button size="sm">Trouver un spécialiste</Button>
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-soft border-b border-border">
                  {hasRole('SPECIALIST')
                    ? <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Patient</th>
                    : <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Spécialiste</th>
                  }
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Service</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Heure</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-soft/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={hasRole('SPECIALIST') ? r.clientFullName : (r.specialistDisplayName ?? 'Spécialiste')}
                          size="sm"
                        />
                        <span className="font-medium text-sm text-text">
                          {hasRole('SPECIALIST') ? r.clientFullName : (r.specialistDisplayName ?? '—')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{r.serviceName}</td>
                    <td className="px-6 py-4 text-sm text-muted">{formatDate(r.slot.date)}</td>
                    <td className="px-6 py-4 text-sm text-muted font-mono">
                      {formatTime(r.slot.startTime)} – {formatTime(r.slot.endTime)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions for specialists */}
      {hasRole('SPECIALIST') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up animation-delay-400">
          {[
            { to: '/services',      emoji: '🩺', title: 'Mes services',       desc: 'Gérer vos offres' },
            { to: '/appointments',  emoji: '📅', title: 'Rendez-vous',        desc: 'Voir le planning' },
            { to: '/messages',      emoji: '💬', title: 'Messages',           desc: 'Lire les messages' },
          ].map(action => (
            <Link key={action.to} to={action.to}>
              <div className="card-hover p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                  {action.emoji}
                </div>
                <div>
                  <p className="font-semibold text-text">{action.title}</p>
                  <p className="text-sm text-muted">{action.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted ml-auto shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
