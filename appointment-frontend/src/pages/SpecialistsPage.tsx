import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ServiceCard } from '@/components/specialist/ServiceCard'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch'
import { serviceApi, specialistApi } from '@/services/api'
import type { SpecialistResponse, SpecialistServiceResponse } from '@/types'

type Filter = 'all' | 'nearby' | 'top-rated' | 'available'

const filterLabels: Record<Filter, string> = {
  all: 'Tous',
  nearby: 'À proximité',
  'top-rated': 'Mieux notés',
  available: 'Disponibles',
}

export function SpecialistsPage() {
  const [servicesMap, setServicesMap] = useState<Record<string, SpecialistServiceResponse[]>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const initialErrorShown = useRef(false)

  const fetchSpecialists = useCallback((page: number, size: number) => {
    if (filter === 'nearby') {
      if (!nearbyCoords) {
        throw new Error(nearbyError ?? 'Location unavailable')
      }
      return specialistApi.getNearby(nearbyCoords.lat, nearbyCoords.lng, 25, page, size)
    }
    return specialistApi.getAll(page, size)
  }, [filter, nearbyCoords, nearbyError])

  const {
    items: specialists,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<SpecialistResponse>(
    fetchSpecialists,
    {
      pageSize: 12,
      deps: [filter, nearbyCoords?.lat, nearbyCoords?.lng, nearbyError],
      getItemKey: (specialist) => specialist.id,
    },
  )

  useEffect(() => {
    if (error && !initialErrorShown.current) {
      toast.error('Erreur lors du chargement des données')
      initialErrorShown.current = true
    }
  }, [error])

  useEffect(() => {
    initialErrorShown.current = false
  }, [filter, search])

  useEffect(() => {
    if (filter !== 'nearby') {
      setNearbyError(null)
      return
    }
    if (!navigator.geolocation) {
      setNearbyCoords(null)
      setNearbyError('La géolocalisation n’est pas disponible sur cet appareil.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearbyCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setNearbyError(null)
      },
      () => {
        setNearbyCoords(null)
        setNearbyError('Impossible d’obtenir votre position.')
      },
    )
  }, [filter])

  useEffect(() => {
    const missingIds = specialists
      .map((s) => s.id)
      .filter((id) => servicesMap[id] === undefined)

    if (missingIds.length === 0) return

    let cancelled = false
    async function loadServices() {
      const idsToFetch = [...missingIds]
      const entries = await Promise.allSettled(
        idsToFetch.map((id) => serviceApi.getActiveBySpecialist(id)),
      )
      if (cancelled) return
      setServicesMap((current) => {
        const next = { ...current }
        idsToFetch.forEach((id, index) => {
          const result = entries[index]
          next[id] = result.status === 'fulfilled' ? result.value : []
        })
        return next
      })
    }
    void loadServices()
    return () => { cancelled = true }
  }, [specialists])

  // Aplatir les spécialistes en services
  const allServices = useMemo(() => {
    const list: { service: SpecialistServiceResponse; specialist: SpecialistResponse }[] = []
    specialists.forEach(specialist => {
      const specialistServices = servicesMap[specialist.id] || []
      specialistServices.forEach(service => {
        list.push({ service, specialist })
      })
    })
    return list
  }, [specialists, servicesMap])

  const filteredServices = useMemo(() => {
    return allServices
      .filter(({ service, specialist }) => {
        if (!search) return true
        const query = search.toLowerCase()
        const specName = (specialist.displayName ?? `${specialist.firstName} ${specialist.lastName}`).toLowerCase()
        const specTitle = (specialist.profileTitle ?? '').toLowerCase()
        const svcName = service.name.toLowerCase()
        return specName.includes(query) || specTitle.includes(query) || svcName.includes(query)
      })
      .filter(({ specialist }) => {
        if (filter === 'top-rated') return (specialist.averageRating ?? 0) >= 4
        return true
      })
  }, [allServices, search, filter])

  async function handleLoadMore() {
    try {
      await loadMore()
    } catch {
      toast.error('Impossible de charger plus de résultats')
    }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Trouver un service</h1>
          <p className="text-muted mt-1">
            Recherchez par prestation, spécialité ou nom
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Ex: 'Massage', 'Consultation', 'Dr Martin'…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={16} />}
            iconRight={search ? (
              <button type="button" onClick={() => setSearch('')} className="text-muted hover:text-text transition-colors">
                <X size={14} />
              </button>
            ) : undefined}
          />
        </div>
        <Button variant="outline" icon={<SlidersHorizontal size={15} />}>
          Filtres
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as Filter[]).map((currentFilter) => (
          <button
            key={currentFilter}
            onClick={() => setFilter(currentFilter)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${filter === currentFilter
                ? 'bg-text text-white shadow-sm'
                : 'bg-surface border border-border text-muted hover:border-primary/40 hover:text-primary'
              }
            `}
          >
            {currentFilter === 'nearby' && <MapPin size={13} />}
            {filterLabels[currentFilter]}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-sm text-muted">
          <span className="font-semibold text-text">{filteredServices.length}</span> prestation{filteredServices.length !== 1 ? 's' : ''} trouvée{filteredServices.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading && !nearbyError ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : nearbyError ? (
        <EmptyState icon={<MapPin size={28} />} title="Position indisponible" description={nearbyError} />
      ) : error ? (
        <EmptyState icon={<Search size={28} />} title="Chargement impossible" description="Une erreur est survenue." />
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="Aucun résultat"
          description="Essayez d'autres critères de recherche."
          action={<Button variant="outline" onClick={() => { setSearch(''); setFilter('all') }}>Réinitialiser</Button>}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredServices.map(({ service, specialist }, index) => (
              <ServiceCard
                key={`${specialist.id}-${service.id}`}
                service={service}
                specialist={specialist}
                delay={index * 40}
              />
            ))}
          </div>

          {hasMore && !search && filter !== 'top-rated' && (
            <div className="flex items-center justify-center pt-2">
              <Button variant="outline" onClick={handleLoadMore} loading={loadingMore}>
                Charger plus de prestations
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
