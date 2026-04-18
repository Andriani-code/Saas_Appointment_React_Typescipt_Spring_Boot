import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { reservationApi } from '@/services/api'
import { AppointmentCard } from '@/components/appointment/AppointmentCard'
import { Input } from '@/components/ui/Input'
import { Spinner, EmptyState } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import type { ReservationResponse, ReservationStatus } from '@/types'
import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

type Tab = 'all' | ReservationStatus

const tabs: { value: Tab; label: string }[] = [
  { value: 'all',       label: 'Tous' },
  { value: 'PENDING',   label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmés' },
  { value: 'COMPLETED', label: 'Terminés' },
  { value: 'CANCELED',  label: 'Annulés' },
]

export function AppointmentsPage() {
  const { hasRole } = useAuth()
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState<Tab>('all')
  const [search, setSearch]             = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = hasRole('SPECIALIST')
        ? await reservationApi.getMyAsSpecialist(0, 50)
        : await reservationApi.getMyAsClient(0, 50)
      setReservations(data.content)
    } catch { /* no-op */ }
    finally { setLoading(false) }
  }, [hasRole])

  useEffect(() => { load() }, [load])

  function handleUpdate(updated: ReservationResponse) {
    setReservations(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const filtered = reservations
    .filter(r => tab === 'all' || r.status === tab)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.serviceName.toLowerCase().includes(q) ||
        r.clientFullName.toLowerCase().includes(q) ||
        (r.specialistDisplayName ?? '').toLowerCase().includes(q)
      )
    })

  const counts = tabs.reduce<Record<Tab, number>>((acc, t) => {
    acc[t.value] = t.value === 'all'
      ? reservations.length
      : reservations.filter(r => r.status === t.value).length
    return acc
  }, {} as Record<Tab, number>)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Mes rendez-vous</h1>
          <p className="text-muted mt-1">Gérez vos consultations en un seul endroit</p>
        </div>
        {hasRole('CLIENT') && (
          <Link to="/specialists">
            <Button icon={<Calendar size={15} />}>Nouveau rendez-vous</Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher par spécialiste, service…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-medium
              transition-all duration-200 border-b-2 -mb-px
              ${tab === t.value
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted hover:text-text hover:border-border'
              }
            `}
          >
            {t.label}
            {counts[t.value] > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full font-semibold
                ${tab === t.value ? 'bg-primary text-white' : 'bg-soft text-muted'}
              `}>
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="Aucun rendez-vous"
          description={tab === 'all'
            ? "Vous n'avez pas encore de rendez-vous."
            : `Aucun rendez-vous avec le statut "${tabs.find(t => t.value === tab)?.label}".`}
          action={hasRole('CLIENT') ? (
            <Link to="/specialists"><Button size="sm">Trouver un spécialiste</Button></Link>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r, i) => (
            <AppointmentCard
              key={r.id}
              reservation={r}
              onUpdate={handleUpdate}
              delay={i * 50}
            />
          ))}
        </div>
      )}
    </div>
  )
}
