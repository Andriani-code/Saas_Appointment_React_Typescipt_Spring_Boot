import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  MapPin, Star, Clock, ChevronLeft, CheckCircle,
  Calendar, MessageSquare, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import { providerApi, serviceApi, slotApi, reviewApi, reservationApi, paymentApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useBookingStore } from '@/store/bookingStore'
import { Avatar, StarRating, StatusBadge, Spinner, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { ServiceCard } from '@/components/provider/ServiceCard'
import { formatCurrency, formatTime, formatDuration } from '@/utils'
import type {
  ProviderResponse, ProviderServiceResponse,
  SlotResponse, ReviewResponse,
} from '@/types'
import { cn } from '@/utils'

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, hasRole } = useAuthStore()
  
  const { 
    selectedProvider, 
    selectedDate, 
    selectedSlot, 
    setProvider, 
    setDate, 
    setSlot,
    resetBooking 
  } = useBookingStore()

  // Get serviceId from query params
  const searchParams = new URLSearchParams(location.search)
  const initialServiceId = searchParams.get('serviceId')

  // We use selectedProvider from the store or fallback to a local state if not set yet.
  const [localProvider, setLocalProvider] = useState<ProviderResponse | null>(null)
  const [services,   setServices]   = useState<ProviderServiceResponse[]>([])
  const [reviews,    setReviews]    = useState<ReviewResponse[]>([])
  const [slots,      setSlots]      = useState<SlotResponse[]>([])
  const [loading,    setLoading]    = useState(true)

  const [selectedService, setSelectedService] = useState<string | null>(initialServiceId)
  
  useEffect(() => {
    if (initialServiceId) {
      setSelectedService(initialServiceId)
    }
  }, [initialServiceId])

  const focusedService = useMemo(() => 
    services.find(s => s.id === selectedService), 
  [services, selectedService])

  const otherServices = useMemo(() => 
    services.filter(s => s.id !== selectedService),
  [services, selectedService])

  const [message,         setMessage]         = useState('')
  const [booking,         setBooking]         = useState(false)
  const [booked,          setBooked]          = useState(false)
  const [showPayment,     setShowPayment]     = useState(false)
  const [reservationId,   setReservationId]   = useState<string | null>(null)
  const [paying,          setPaying]          = useState(false)

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!id) return
    resetBooking() // clear previous booking state
    Promise.all([
      providerApi.getById(id),
      serviceApi.getActiveByProvider(id),
      reviewApi.getByProvider(id),
    ]).then(([spec, svc, rev]) => {
      setLocalProvider(spec)
      setProvider(spec)
      setServices(svc)
      setReviews(rev.content)
      
      // If no service pre-selected, select the first one
      if (!initialServiceId && svc.length > 0) {
        setSelectedService(svc[0].id)
      }
    }).finally(() => setLoading(false))
  }, [id, initialServiceId])

  useEffect(() => {
    if (!id || !selectedDate) {
       setSlots([])
       return
    }
    slotApi.getByProviderAndDate(id, selectedDate).then(setSlots)
  }, [id, selectedDate])

  async function handleBook() {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour réserver")
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }

    if (!hasRole('CLIENT')) {
      toast.error("Seuls les clients peuvent effectuer une réservation")
      return
    }

    if (!selectedSlot || !selectedService || !selectedDate) {
      toast.error("Veuillez sélectionner une date, un créneau et un service")
      return
    }
    
    setBooking(true)
    try {
      const res = await reservationApi.book({ slotId: selectedSlot, serviceId: selectedService, clientMessage: message })
      setReservationId(res.id)
      
      if (focusedService?.depositEnabled) {
        setShowPayment(true)
      } else {
        setBooked(true)
        if (id && selectedDate) {
           slotApi.getByProviderAndDate(id, selectedDate).then(setSlots)
        }
      }
    } catch { 
      toast.error("Erreur lors de la réservation")
    }
    finally { setBooking(false) }
  }

  async function handlePayment() {
    if (!reservationId) return
    setPaying(true)
    const toastId = toast.loading("Initialisation du paiement...")
    try {
      await paymentApi.createIntent(reservationId)
      toast.success("Paiement réussi ! (Simulation Stripe)", { id: toastId })
      setBooked(true)
      setShowPayment(false)
    } catch (err) {
      toast.error("Erreur lors du paiement", { id: toastId })
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )

  if (!localProvider) return (
    <EmptyState icon={<Star size={28} />} title="Prestataire introuvable" />
  )

  const name = localProvider.displayName ?? `${localProvider.firstName} ${localProvider.lastName}`

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-medium">
        <ChevronLeft size={16} />Retour
      </button>

      {/* Provider Header */}
      <div className="card overflow-hidden p-0">
        <div className="h-32 bg-gradient-to-r from-primary-800 via-primary to-primary-400 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-8 mb-4">
            <div className="ring-4 ring-surface rounded-2xl">
              <Avatar name={name} src={localProvider.profilePhoto} size="xl" />
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-text">{name}</h1>
                  <p className="text-primary font-medium">{localProvider.profileTitle ?? 'Prestataire'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<MessageSquare size={14} />}>
                    Message
                  </Button>
                  {localProvider.isVerified && (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-semibold">
                      <Shield size={12} />Vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
             {localProvider.averageRating && (
               <div className="flex items-center gap-1.5">
                 <StarRating rating={localProvider.averageRating} size={14} />
                 <span className="text-muted">({reviews.length} avis)</span>
               </div>
             )}
             {localProvider.serviceAddress && (
               <span className="flex items-center gap-1.5">
                 <MapPin size={14} className="text-primary" />
                 {localProvider.serviceAddress.city}
               </span>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Focused Service Info + Reviews */}
        <div className="lg:col-span-3 space-y-6">
          {/* Focused Service Detail */}
          <div className="card p-6 border-l-4 border-primary">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h2 className="text-xl font-bold text-text mb-1">{focusedService?.name || 'Service sélectionné'}</h2>
                  <div className="flex items-center gap-3 text-sm text-muted">
                     <span className="flex items-center gap-1"><Clock size={14} /> {focusedService ? formatDuration(focusedService.durationMinutes) : '-'}</span>
                     {focusedService?.depositEnabled && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Dépôt requis</span>}
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-display font-black text-primary">{focusedService ? formatCurrency(focusedService.price) : '-'}</p>
               </div>
            </div>
            {focusedService?.description && (
               <p className="text-sm text-muted leading-relaxed">{focusedService.description}</p>
            )}
          </div>

          {/* Provider Bio if not showing service desc */}
          {!focusedService?.description && localProvider.bio && (
            <div className="card p-6">
               <h3 className="text-sm font-bold text-text uppercase tracking-widest mb-3">À propos du prestataire</h3>
               <p className="text-sm text-muted leading-relaxed">{localProvider.bio}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="section-title">Avis clients</h2>
              {localProvider.averageRating && (
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold text-primary">{localProvider.averageRating.toFixed(1)}</span>
                  <StarRating rating={localProvider.averageRating} size={15} />
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

          {/* Other Services section at the bottom */}
          {otherServices.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-border/50">
              <h3 className="section-title flex items-center gap-2 text-lg">
                <Calendar size={20} className="text-primary" />
                Autres prestations de {localProvider.displayName || localProvider.firstName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {otherServices.map(svc => (
                  <div key={svc.id} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <ServiceCard 
                      service={svc} 
                      provider={localProvider} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking panel */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-5 sticky top-6 border-t-4 border-primary">
            {booked ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-text">Réservation confirmée !</h3>
                <p className="text-sm text-muted">Merci pour votre confiance. Vous recevrez une notification d'approbation.</p>
                <Button variant="outline" fullWidth onClick={() => navigate('/appointments')}>
                  Voir mes rendez-vous
                </Button>
              </div>
            ) : showPayment ? (
               <div className="space-y-4 animate-fade-in">
                  <h3 className="section-title text-center text-primary">Paiement du dépôt</h3>
                  <div className="bg-soft p-4 rounded-xl border border-primary/20 space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Service</span>
                        <span className="font-bold text-text">{focusedService?.name}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Montant total</span>
                        <span className="text-text font-medium">{formatCurrency(focusedService?.price || 0)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-text font-bold">Dépôt à payer</span>
                        <span className="text-primary font-extrabold">{formatCurrency(focusedService?.depositAmount || 0)}</span>
                     </div>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-3 text-center">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Shield size={20} />
                     </div>
                     <p className="text-xs text-muted">Paiement sécurisé via Stripe</p>
                  </div>

                  <Button fullWidth loading={paying} onClick={handlePayment}>
                    Payer maintenant
                  </Button>
                  <button onClick={() => setBooked(true)} className="w-full text-xs text-muted hover:underline">
                    Payer plus tard (la réservation restera en attente)
                  </button>
               </div>
            ) : (
              <>
                <h3 className="section-title flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />Réserver ce service
                </h3>

                {/* Date picker */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">1. Choisir une date</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {dates.map(d => {
                      const date = new Date(d)
                      const isSelected = selectedDate === d
                      return (
                        <button key={d} onClick={() => { setDate(d); setSlot(null) }}
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
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">2. Créneaux disponibles</p>
                    {slots.length === 0 ? (
                      <p className="text-sm text-muted text-center py-4">Aucun créneau disponible ce jour.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {slots.map(slot => (
                          <button key={slot.id}
                            onClick={() => setSlot(slot.id)}
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
                    3. Message (optionnel)
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
                  disabled={!selectedSlot || !selectedService || (isAuthenticated && !hasRole('CLIENT'))}
                  onClick={handleBook}
                  size="lg"
                  icon={<Calendar size={16} />}
                >
                  {isAuthenticated && !hasRole('CLIENT') ? 'Réservation réservée aux clients' : 'Confirmer la réservation'}
                </Button>

                {(!selectedService || !selectedSlot) && !(isAuthenticated && !hasRole('CLIENT')) && (
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
