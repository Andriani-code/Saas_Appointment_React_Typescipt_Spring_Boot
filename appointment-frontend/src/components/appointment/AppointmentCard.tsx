import { useState, memo } from 'react'
import { Calendar, Check, Clock, Eye, MessageSquare, MoreVertical, RotateCcw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { reservationApi } from '@/services/api'
import { Avatar, StatusBadge } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { ReservationResponse } from '@/types'
import { formatCurrency, formatDate, formatTime } from '@/utils'

interface AppointmentCardProps {
  reservation: ReservationResponse
  onUpdate: (updated: ReservationResponse) => void
  delay?: number
}

export const AppointmentCard = memo(function AppointmentCard({ reservation, onUpdate, delay = 0 }: AppointmentCardProps) {
  const { hasRole } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isProvider = hasRole('PROVIDER')
  const name = isProvider ? reservation.clientFullName : (reservation.providerDisplayName ?? 'Providere')

  async function doAction(action: () => Promise<ReservationResponse>) {
    setLoading(true)
    try {
      onUpdate(await action())
} finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  return (
    <div
      className="card-hover p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="md" />
          <div>
            <p className="font-semibold text-text text-sm">{name}</p>
            <p className="text-xs text-primary font-medium mt-0.5">{reservation.serviceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={reservation.status} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-soft transition-colors"
              aria-label={menuOpen ? 'Fermer le menu du rendez-vous' : 'Ouvrir le menu du rendez-vous'}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-card z-20 py-1 min-w-[160px]"
                role="menu"
                aria-label="Actions du rendez-vous"
              >
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted hover:bg-soft hover:text-text transition-colors"
                  role="menuitem"
                  aria-label="Voir le detail du rendez-vous"
                >
                  <Eye size={14} />Voir le detail
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted hover:bg-soft hover:text-text transition-colors"
                  role="menuitem"
                  aria-label="Envoyer un message au sujet du rendez-vous"
                >
                  <MessageSquare size={14} />Message
                </button>
                {reservation.status !== 'CANCELED' && reservation.status !== 'COMPLETED' && reservation.status !== 'REJECTED' && reservation.status !== 'NO_SHOW' && (
                  <button
                    type="button"
                    onClick={() => doAction(() => reservationApi.cancel(reservation.id))}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-accent hover:bg-accent/15 transition-colors"
                    role="menuitem"
                    aria-label="Annuler le rendez-vous"
                  >
                    <X size={14} />Annuler
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-muted mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className="text-primary" />
          {formatDate(reservation.slot.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-primary" />
          {formatTime(reservation.slot.startTime)} - {formatTime(reservation.slot.endTime)}
        </span>
      </div>

      {reservation.clientMessage && (
        <p className="text-xs text-muted bg-soft rounded-lg px-3 py-2 mb-4 line-clamp-2">
          "{reservation.clientMessage}"
        </p>
      )}

      {reservation.depositRequired && reservation.depositAmount && (
        <div className="flex items-center justify-between text-xs bg-accent/15 border border-accent/40 rounded-lg px-3 py-2 mb-4">
          <span className="text-accent font-medium">Depot requis</span>
          <span className="font-bold text-accent">{formatCurrency(reservation.depositAmount)}</span>
        </div>
      )}

      {isProvider && reservation.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            fullWidth
            loading={loading}
            icon={<Check size={14} />}
            onClick={() => doAction(() => reservationApi.confirm(reservation.id))}
          >
            Confirmer
          </Button>
          <Button
            size="sm"
            variant="outline"
            fullWidth
            icon={<X size={14} />}
            onClick={() => doAction(() => reservationApi.reject(reservation.id))}
            className="border-accent/40 text-accent hover:bg-accent/15"
          >
            Rejeter
          </Button>
        </div>
      )}

      {isProvider && reservation.status === 'CONFIRMED' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            fullWidth
            loading={loading}
            icon={<Check size={14} />}
            onClick={() => doAction(() => reservationApi.complete(reservation.id))}
          >
            Terminer
          </Button>
          <Button
            size="sm"
            variant="outline"
            fullWidth
            onClick={() => doAction(() => reservationApi.noShow(reservation.id))}
            className="border-muted/40 text-primary hover:bg-muted/15"
          >
            Absent
          </Button>
        </div>
      )}

      {!isProvider && (reservation.status === 'CANCELED' || reservation.status === 'REJECTED') && (
        <Button
          size="sm"
          variant="outline"
          fullWidth
          icon={<RotateCcw size={13} />}
          onClick={() => navigate(`/appointments`)}
        >
          Reprendre rendez-vous
        </Button>
      )}
    </div>
  )
});
