import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react'
import { specialistApi, serviceApi } from '@/services/api'
import { SpecialistCard } from '@/components/specialist/SpecialistCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState } from '@/components/ui'
import type { SpecialistResponse, SpecialistServiceResponse } from '@/types'

type Filter = 'all' | 'nearby' | 'top-rated' | 'available'

const filterLabels: Record<Filter, string> = {
  all:        'Tous',
  nearby:     'À proximité',
  'top-rated': 'Mieux notés',
  available:  'Disponibles',
}

export function SpecialistsPage() {
  const [specialists, setSpecialists]   = useState<SpecialistResponse[]>([])
  const [servicesMap, setServicesMap]   = useState<Record<string, SpecialistServiceResponse[]>>({})
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState<Filter>('all')
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(1)

  const fetchSpecialists = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (filter === 'nearby' && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        )
        data = await specialistApi.getNearby(pos.coords.latitude, pos.coords.longitude, 25, page)
      } else {
        data = await specialistApi.getAll(page)
      }
      setSpecialists(data.content)
      setTotalPages(data.totalPages)

      // Fetch services for each specialist
      const svcEntries = await Promise.allSettled(
        data.content.map(s => serviceApi.getActiveBySpecialist(s.id))
      )
      const map: Record<string, SpecialistServiceResponse[]> = {}
      data.content.forEach((s, i) => {
        const result = svcEntries[i]
        map[s.id] = result.status === 'fulfilled' ? result.value : []
      })
      setServicesMap(map)
    } catch { /* no-op */ }
    finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchSpecialists() }, [fetchSpecialists])

  const filtered = specialists.filter(s => {
    if (!search) return true
    const name = (s.displayName ?? `${s.firstName} ${s.lastName}`).toLowerCase()
    const title = (s.profileTitle ?? '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || title.includes(q)
  }).filter(s => {
    if (filter === 'top-rated') return (s.averageRating ?? 0) >= 4
    return true
  })

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Trouver un spécialiste</h1>
          <p className="text-muted mt-1">
            Recherchez par nom, spécialité ou localisation
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Ex: 'cardiologue' ou 'Dr Martin'…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={16} />}
            iconRight={search ? (
              <button onClick={() => setSearch('')} className="text-muted hover:text-text transition-colors">
                <X size={14} />
              </button>
            ) : undefined}
          />
        </div>
        <Button variant="outline" icon={<SlidersHorizontal size={15} />}>
          Filtres
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0) }}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${filter === f
                ? 'bg-text text-white shadow-sm'
                : 'bg-surface border border-border text-muted hover:border-primary/40 hover:text-primary'
              }
            `}
          >
            {f === 'nearby' && <MapPin size={13} />}
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted">
          <span className="font-semibold text-text">{filtered.length}</span> spécialiste{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="Aucun spécialiste trouvé"
          description="Essayez d'autres mots-clés ou modifiez vos filtres."
          action={
            <Button variant="outline" onClick={() => { setSearch(''); setFilter('all') }}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, i) => (
            <SpecialistCard
              key={s.id}
              specialist={s}
              services={servicesMap[s.id] ?? []}
              delay={i * 60}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Précédent
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`
                w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200
                ${page === i ? 'bg-primary text-white shadow-primary/30' : 'bg-surface border border-border text-muted hover:border-primary'}
              `}
            >
              {i + 1}
            </button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
