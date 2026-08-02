import { useState, memo } from 'react'
import { Calendar, Check, Clock, Eye, MessageSquare, MoreVertical, RotateCcw, Send, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { reservationApi, messagingApi } from '@/services/api'
import { Avatar, StatusBadge } from '@/components/ui'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/Button'
import type { ReservationResponse, ReservationStatus } from '@/types'
import { cn, formatCurrency, formatDate, formatTime } from '@/utils'

interface AppointmentCardProps {
  reservation: ReservationResponse
  onUpdate: (updated: ReservationResponse) => void
  delay?: number
}

const statusAccent: Record<ReservationStatus, { bar: string; tile: string }> = {
  PENDING: { bar: 'bg-warning', tile: 'bg-warning/15 text-warning-300' },
  CONFIRMED: { bar: 'bg-primary', tile: 'bg-primary/15 text-primary-300' },
  COMPLETED: { bar: 'bg-success', tile: 'bg-success/15 text-success-300' },
  CANCELED: { bar: 'bg-muted/60', tile: 'bg-muted/10 text-muted' },
  REJECTED: { bar: 'bg-danger', tile: 'bg-danger/15 text-danger-300' },
  NO_SHOW: { bar: 'bg-muted/60', tile: 'bg-muted/10 text-muted' },
}

export const AppointmentCard = memo(function AppointmentCard({ reservation, onUpdate, delay = 0 }: AppointmentCardProps) {
  const { hasRole } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [messagingLoading, setMessagingLoading] = useState(false)

  const isProvider = hasRole('PROVIDER')
  const name = isProvider ? reservation.clientFullName : (reservation.providerDisplayName ?? 'Providere')
  const accent = statusAccent[reservation.status]

  async function doAction(action: () => Promise<ReservationResponse>) {
    setLoading(true)
    try {
      onUpdate(await action())
} finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  async function handleMessage() {
    setMessagingLoading(true)
    try {
      const conversation = await messagingApi.getOrCreateConversationForReservation(reservation.id)
      setMenuOpen(false)
      navigate('/messages', { state: { conversationId: conversation.id } })
    } catch {
      toast.error("Impossible d'ouvrir la conversation")
      setMessagingLoading(false)
      setMenuOpen(false)
    }
  }

  return (
    <div
      className="card-hover p-5 animate-slide-up relative overflow-hidden"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Liseré de statut à gauche */}
      <span className={cn('absolute left-0 top-0 bottom-0 w-1', accent.bar)} aria-hidden />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={name} size="md" className="ring-2 ring-primary/20" />
            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card', accent.bar)} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text text-sm truncate">{name}</p>
            <p className="text-xs text-primary font-medium mt-0.5 truncate">{reservation.serviceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
                className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-card z-20 py-1 min-w-[160px] animate-slide-down origin-top-right"
                role="menu"
                aria-label="Actions du rendez-vous"
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setShowDetails(true) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted hover:bg-soft hover:text-text transition-colors"
                  role="menuitem"
                  aria-label="Voir le detail du rendez-vous"
                >
                  <Eye size={14} />Voir le detail
                </button>
                <button
                  type="button"
                  onClick={handleMessage}
                  disabled={messagingLoading}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted hover:bg-soft hover:text-text transition-colors disabled:opacity-50"
                  role="menuitem"
                  aria-label="Envoyer un message au sujet du rendez-vous"
                >
                  <MessageSquare size={14} />{messagingLoading ? 'Ouverture...' : 'Message'}
                </button>
                {reservation.status !== 'CANCELED' && reservation.status !== 'COMPLETED' && reservation.status !== 'REJECTED' && reservation.status !== 'NO_SHOW' && (
                  <button
                    type="button"
                    onClick={() => doAction(() => reservationApi.cancel(reservation.id))}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger hover:bg-danger/15 transition-colors"
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

      <div className="flex items-center gap-3 mb-4">
        <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2 flex-1', accent.tile)}>
          <Calendar size={15} />
          <span className="text-sm font-semibold truncate">{formatDate(reservation.slot.date)}</span>
        </div>
        <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2 flex-1', accent.tile)}>
          <Clock size={15} />
          <span className="text-sm font-semibold truncate">
            {formatTime(reservation.slot.startTime)} – {formatTime(reservation.slot.endTime)}
          </span>
        </div>
      </div>

      {reservation.clientMessage && (
        <div className="relative rounded-xl bg-soft/60 border border-border/60 px-4 py-3 mb-4">
          <span className="absolute -top-2 left-3 px-1.5 bg-card text-[10px] font-bold text-muted uppercase tracking-wider rounded">
            Message
          </span>
          <p className="text-xs text-muted leading-relaxed line-clamp-2">"{reservation.clientMessage}"</p>
        </div>
      )}

      {reservation.depositRequired && reservation.depositAmount && (
        <div className="flex items-center justify-between text-xs bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-accent font-semibold">Dépôt requis</span>
          <span className="font-bold text-accent text-sm">{formatCurrency(reservation.depositAmount)}</span>
        </div>
      )}

      {isProvider && reservation.status === 'PENDING' && (
        <div className="flex gap-2 pt-1">
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
            className="border-danger/40 text-danger hover:bg-danger/15"
          >
            Rejeter
          </Button>
        </div>
      )}

      {isProvider && reservation.status === 'CONFIRMED' && (
        <div className="flex gap-2 pt-1">
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

      {!isProvider && reservation.status === 'COMPLETED' && (
        <Button
          size="sm"
          fullWidth
          variant="outline"
          icon={<MessageSquare size={13} />}
          onClick={handleMessage}
        >
          Discuter
        </Button>
      )}

      <Modal open={showDetails} onClose={() => setShowDetails(false)} title="Détail du rendez-vous">
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-text">{name}</p>
              <p className="text-xs text-primary font-medium mt-0.5">{reservation.serviceName}</p>
            </div>
            <StatusBadge status={reservation.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-soft/70 px-3 py-2.5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">Date</p>
              <p className="flex items-center gap-1.5 font-semibold text-text">
                <Calendar size={13} className="text-primary" />{formatDate(reservation.slot.date)}
              </p>
            </div>
            <div className="rounded-xl bg-soft/70 px-3 py-2.5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">Heure</p>
              <p className="flex items-center gap-1.5 font-semibold text-text">
                <Clock size={13} className="text-primary" />
                {formatTime(reservation.slot.startTime)} – {formatTime(reservation.slot.endTime)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 bg-soft rounded-xl p-4">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Prestataire</dt>
              <dd className="font-semibold text-text text-right">{reservation.providerDisplayName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Client</dt>
              <dd className="font-semibold text-text text-right">{reservation.clientFullName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Créé le</dt>
              <dd className="font-semibold text-text text-right">{formatDate(reservation.createdAt)}</dd>
            </div>
          </dl>

          {reservation.clientMessage && (
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Message du client</p>
              <p className="text-sm text-text bg-soft rounded-lg px-3 py-2">"{reservation.clientMessage}"</p>
            </div>
          )}

          {reservation.depositRequired && reservation.depositAmount && (
            <div className="flex items-center justify-between text-xs bg-accent/15 border border-accent/40 rounded-lg px-3 py-2">
              <span className="text-accent font-medium">Dépôt requis</span>
              <span className="font-bold text-accent">{formatCurrency(reservation.depositAmount)}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              fullWidth
              variant="outline"
              icon={<Send size={14} />}
              loading={messagingLoading}
              onClick={() => {
                setShowDetails(false)
                void handleMessage()
              }}
            >
              Envoyer un message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
});
