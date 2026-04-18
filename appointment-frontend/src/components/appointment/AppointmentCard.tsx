import { useState } from 'react'
import { Calendar, Clock, MessageSquare, Eye, RotateCcw, Check, X, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge, Avatar } from '@/components/ui'
import { formatDate, formatTime, formatCurrency, cn } from '@/utils'
import { reservationApi } from '@/services/api'
import type { ReservationResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface AppointmentCardProps {
  reservation: ReservationResponse
  onUpdate: (updated: ReservationResponse) => void
  delay?: number
}

export function AppointmentCard({ reservation: r, onUpdate, delay = 0 }: AppointmentCardProps) {
  const { hasRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isSpecialist = hasRole('SPECIALIST')
  const name = isSpecialist ? r.clientFullName : (r.specialistDisplayName ?? 'Spécialiste')

  async function doAction(action: () => Promise<ReservationResponse>) {
    setLoading(true)
    try { onUpdate(await action()) }
    catch { /* no-op */ }
    finally { setLoading(false); setMenuOpen(false) }
  }

  return (
    <div
      className="card-hover p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="md" />
          <div>
            <p className="font-semibold text-text text-sm">{name}</p>
            <p className="text-xs text-primary font-medium mt-0.5">{r.serviceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={r.status} />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-soft transition-colors"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-card z-20 py-1 min-w-[160px]">
                <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted hover:bg-soft hover:text-text transition-colors">
                  <Eye size={14} />Voir le détail
                </button>
                <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted hover:bg-soft hover:text-text transition-colors">
                  <MessageSquare size={14} />Message
                </button>
                {r.status !== 'CANCELED' && r.status !== 'COMPLETED' && r.status !== 'REJECTED' && (
                  <button
                    onClick={() => doAction(() => reservationApi.cancel(r.id))}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X size={14} />Annuler
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date/Time */}
      <div className="flex flex-wrap gap-3 text-sm text-muted mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className="text-primary" />
          {formatDate(r.slot.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-primary" />
          {formatTime(r.slot.startTime)} – {formatTime(r.slot.endTime)}
        </span>
      </div>

      {r.clientMessage && (
        <p className="text-xs text-muted bg-soft rounded-lg px-3 py-2 mb-4 italic line-clamp-2">
          "{r.clientMessage}"
        </p>
      )}

      {r.depositRequired && r.depositAmount && (
        <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          <span className="text-amber-700 font-medium">Dépôt requis</span>
          <span className="font-bold text-amber-800">{formatCurrency(r.depositAmount)}</span>
        </div>
      )}

      {/* Specialist actions */}
      {isSpecialist && r.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button
            size="sm" fullWidth loading={loading}
            icon={<Check size={14} />}
            onClick={() => doAction(() => reservationApi.confirm(r.id))}
          >
            Confirmer
          </Button>
          <Button
            size="sm" variant="outline" fullWidth
            icon={<X size={14} />}
            onClick={() => doAction(() => reservationApi.reject(r.id))}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Rejeter
          </Button>
        </div>
      )}

      {isSpecialist && r.status === 'CONFIRMED' && (
        <div className="flex gap-2">
          <Button size="sm" fullWidth loading={loading} icon={<Check size={14} />}
            onClick={() => doAction(() => reservationApi.complete(r.id))}>
            Terminer
          </Button>
          <Button size="sm" variant="outline" fullWidth
            onClick={() => doAction(() => reservationApi.noShow(r.id))}
            className="border-gray-200 text-gray-500 hover:bg-gray-50">
            Absent
          </Button>
        </div>
      )}

      {/* Client: reschedule for canceled */}
      {!isSpecialist && (r.status === 'CANCELED' || r.status === 'REJECTED') && (
        <Button size="sm" variant="outline" fullWidth icon={<RotateCcw size={13} />}>
          Reprendre rendez-vous
        </Button>
      )}
    </div>
  )
}
