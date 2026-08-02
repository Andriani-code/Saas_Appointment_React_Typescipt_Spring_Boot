import { useEffect, useState } from 'react'
import { AppointmentCard } from '@/components/appointment/AppointmentCard'
import { useAuthStore } from '@/store/authStore'
import type { ReservationResponse, Role } from '@/types'

function makeReservation(overrides: Partial<ReservationResponse>): ReservationResponse {
  return {
    id: 'res-1',
    clientId: 'client-1',
    clientFullName: 'Jane Client',
    providerId: 'provider-1',
    providerDisplayName: 'Dr Martin Rakoto',
    serviceId: 'service-1',
    serviceName: 'Consultation générale',
    slot: {
      id: 'slot-1',
      providerId: 'provider-1',
      date: '2026-08-10',
      startTime: '09:00:00',
      endTime: '09:30:00',
      status: 'BOOKED',
    },
    status: 'PENDING',
    depositRequired: false,
    createdAt: '2026-08-01T10:00:00Z',
    ...overrides,
  }
}

const samples: { label: string; reservation: ReservationResponse }[] = [
  {
    label: 'En attente',
    reservation: makeReservation({
      status: 'PENDING',
      clientMessage: 'Bonjour, j’aimerais discuter de mes analyses s’il vous plaît.',
    }),
  },
  {
    label: 'Confirmé + dépôt',
    reservation: makeReservation({
      status: 'CONFIRMED',
      depositRequired: true,
      depositAmount: 50000,
    }),
  },
  {
    label: 'Terminé',
    reservation: makeReservation({ status: 'COMPLETED' }),
  },
  {
    label: 'Annulé',
    reservation: makeReservation({ status: 'CANCELED' }),
  },
  {
    label: 'En attente + message',
    reservation: makeReservation({
      status: 'PENDING',
      clientMessage: 'Peut-on avancer le rendez-vous à 8h ?',
    }),
  },
  {
    label: 'Confirmé + message',
    reservation: makeReservation({
      status: 'CONFIRMED',
      clientMessage: 'Merci beaucoup !',
    }),
  },
]

const roleOptions: { label: string; role: Role }[] = [
  { label: '👤 Client', role: 'CLIENT' },
  { label: '🩺 Prestataire', role: 'PROVIDER' },
]

export function DesignDemoPage() {
  const [, setVersion] = useState(0)
  const [activeRole, setActiveRole] = useState<Role>('CLIENT')

  // Force l'état du store pour la démo (sans toucher au localStorage)
  useEffect(() => {
    useAuthStore.setState({
      user: { email: 'demo@example.com', role: activeRole, profileCompleted: true },
      isAuthenticated: true,
    })
  }, [activeRole])

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-text">Design · AppointmentCard</h1>
            <p className="text-muted text-sm mt-1">Aperçu de la carte de rendez-vous dans tous ses états</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-soft p-1">
              {roleOptions.map(({ label, role }) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeRole === role ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setVersion((v) => v + 1)}
              className="px-4 py-2 rounded-xl bg-soft text-text text-sm font-semibold hover:bg-soft/70 transition-colors"
            >
              ↻ Rafraîchir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {samples.map(({ label, reservation }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{label}</p>
              <AppointmentCard reservation={reservation} onUpdate={() => undefined} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
