import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Star, Clock, ChevronLeft, CheckCircle,
  Calendar, MessageSquare, Shield
} from 'lucide-react'
import { specialistApi, serviceApi, slotApi, reviewApi, reservationApi } from '@/services/api'
import { Avatar, StarRating, StatusBadge, Spinner, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatTime, formatDuration } from '@/utils'
import type {
  SpecialistResponse, SpecialistServiceResponse,
  SlotResponse, ReviewResponse,
} from '@/types'
import { cn } from '@/utils'

export function SpecialistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [specialist, setSpecialist] = useState<SpecialistResponse | null>(null)
  const [services,   setServices]   = useState<SpecialistServiceResponse[]>([])
  const [reviews,    setReviews]    = useState<ReviewResponse[]>([])
  const [slots,      setSlots]      = useState<SlotResponse[]>([])
  const [loading,    setLoading]    = useState(true)

  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate,    setSelectedDate]    = useState<string>('')
  const [selectedSlot,    setSelectedSlot]    = useState<string | null>(null)
  const [message,         setMessage]         = useState('')
  const [booking,         setBooking]         = useState(false)
  const [booked,          setBooked]          = useState(false)

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!id) return
    Promise.all([
      specialistApi.getById(id),
      serviceApi.getActiveBySpecialist(id),
      reviewApi.getBySpecialist(id),
    ]).then(([spec, svc, rev]) => {
      setSpecialist(spec)
      setServices(svc)
      setReviews(rev.content)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !selectedDate) return
    slotApi.getBySpecialistAndDate(id, selectedDate).then(setSlots)
  }, [id, selectedDate])

  async function handleBook() {
    if (!selectedSlot || !selectedService) return
    setBooking(true)
    try {
      await reservationApi.book({ slotId: selectedSlot, serviceId: selectedService, clientMessage: message })
      setBooked(true)
    } catch { /* error handling */ }
    finally { setBooking(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )

  if (!specialist) return (
    <EmptyState icon={<Star size={28} />} title="Spécialiste introuvable" />
  )

  const name = specialist.displayName ?? `${specialist.firstName} ${specialist.lastName}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-medium">
        <ChevronLeft size={16} />Retour
      </button>

      {/* Cover + Profile */}
      <div className="card overflow-hidden p-0">
        <div className="h-36 bg-gradient-to-r from-primary-800 via-primary to-primary-400 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-8 mb-4">
            <div className="ring-4 ring-surface rounded-2xl">
              <Avatar name={name} src={specialist.profilePhoto} size="xl" />
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-text">{name}</h1>
                  <p className="text-primary font-medium">{specialist.profileTitle ?? 'Spécialiste'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<MessageSquare size={14} />}>
                    Message
                  </Button>
                  {specialist.isVerified && (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-semibold">
                      <Shield size={12} />Vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted">
            {specialist.averageRating && (
              <div className="flex items-center gap-1.5">
                <StarRating rating={specialist.averageRating} size={14} />
                <span className="text-muted">({reviews.length} avis)</span>
              </div>
            )}
            {specialist.serviceAddress && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                {specialist.serviceAddress.city}
              </span>
            )}
          </div>

          {specialist.bio && (
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-2xl">{specialist.bio}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Services + Reviews */}
        <div className="lg:col-span-3 space-y-6">
          {/* Services */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="section-title">Services proposés</h2>
            </div>
            <div className="divide-y divide-border">
              {services.map(svc => (
                <div key={svc.id}
                  onClick={() => setSelectedService(svc.id)}
                  className={cn(
                    'flex items-center justify-between px-5 py-4 cursor-pointer transition-colors',
                    selectedService === svc.id ? 'bg-primary/5' : 'hover:bg-soft'
                  )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      selectedService === svc.id ? 'border-primary bg-primary' : 'border-border'
                    )}>
                      {selectedService === svc.id && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text">{svc.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock size={10} />{formatDuration(svc.durationMinutes)}
                        </span>
                        {svc.depositEnabled && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Dépôt requis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-text">{formatCurrency(svc.price)}</p>
                    {svc.depositEnabled && svc.depositAmount && (
                      <p className="text-xs text-muted">Dépôt: {formatCurrency(svc.depositAmount)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="section-title">Avis clients</h2>
              {specialist.averageRating && (
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold text-primary">{specialist.averageRating.toFixed(1)}</span>
                  <StarRating rating={specialist.averageRating} size={15} />
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="py-10 text-center text-muted text-sm">Aucun avis pour l'instant.</div>
            ) : (
              <div className="divide-y divide-border">
                {reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.clientFullName} size="sm" />
                        <span className="font-medium text-sm text-text">{r.clientFullName}</span>
                      </div>
                      <StarRating rating={r.rating} size={13} />
                    </div>
                    {r.comment && <p className="text-sm text-muted pl-10">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking panel */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-5 sticky top-6">
            {booked ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-text">Réservation envoyée !</h3>
                <p className="text-sm text-muted">Vous recevrez une confirmation dès l'approbation du spécialiste.</p>
                <Button variant="outline" fullWidth onClick={() => navigate('/appointments')}>
                  Voir mes rendez-vous
                </Button>
              </div>
            ) : (
              <>
                <h3 className="section-title flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />Réserver un créneau
                </h3>

                {/* Date picker */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Choisir une date</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {dates.map(d => {
                      const date = new Date(d)
                      const isSelected = selectedDate === d
                      return (
                        <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                          className={cn(
                            'flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition-all duration-200',
                            isSelected
                              ? 'bg-primary text-white shadow-primary/30'
                              : 'bg-soft text-muted hover:bg-primary/10 hover:text-primary'
                          )}>
                          <span className="uppercase opacity-70 text-[10px]">
                            {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </span>
                          <span className="font-bold text-base">{date.getDate()}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Créneaux disponibles</p>
                    {slots.length === 0 ? (
                      <p className="text-sm text-muted text-center py-4">Aucun créneau disponible ce jour.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {slots.map(slot => (
                          <button key={slot.id}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={cn(
                              'py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                              selectedSlot === slot.id
                                ? 'bg-primary text-white'
                                : 'bg-soft text-muted hover:bg-primary/10 hover:text-primary'
                            )}>
                            {formatTime(slot.startTime)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Message (optionnel)
                  </p>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Décrivez brièvement votre demande…"
                    className="input-base resize-none"
                  />
                </div>

                <Button
                  fullWidth
                  loading={booking}
                  disabled={!selectedSlot || !selectedService}
                  onClick={handleBook}
                  size="lg"
                  icon={<Calendar size={16} />}
                >
                  Confirmer la réservation
                </Button>

                {(!selectedService || !selectedSlot) && (
                  <p className="text-xs text-muted text-center">
                    {!selectedService ? 'Sélectionnez un service' : 'Sélectionnez un créneau'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
