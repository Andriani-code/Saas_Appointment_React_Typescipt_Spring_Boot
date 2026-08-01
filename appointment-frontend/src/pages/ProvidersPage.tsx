import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ServiceCard } from '@/components/provider/ServiceCard'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch'
import { serviceApi, providerApi } from '@/services/api'
import type { ProviderResponse, ProviderServiceResponse } from '@/types'

type Filter = 'all' | 'nearby' | 'top-rated'

const filterLabels: Record<Filter, string> = {
  all: 'Tous',
  nearby: 'À proximité',
  'top-rated': 'Mieux notés',
}

export function ProvidersPage() {
  const [servicesMap, setServicesMap] = useState<Record<string, ProviderServiceResponse[]>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const initialErrorShown = useRef(false)

  // While the browser is still asking for geolocation, we keep showing a
  // spinner instead of flashing an error.
  const geolocationPending = filter === 'nearby' && !nearbyCoords && !nearbyError

  const fetchProviders = useCallback((page: number, size: number) => {
    if (filter === 'nearby') {
      if (!nearbyCoords) {
        // Geolocation not resolved yet — nothing to fetch.
        return Promise.resolve({
          content: [],
          page,
          size,
          totalElements: 0,
          totalPages: 0,
          last: true,
        })
      }
      return providerApi.getNearby(nearbyCoords.lat, nearbyCoords.lng, 25, page, size)
    }
    return providerApi.getAll(page, size)
  }, [filter, nearbyCoords])

  const {
    items: providers,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<ProviderResponse>(
    fetchProviders,
    {
      pageSize: 12,
      deps: [filter, nearbyCoords?.lat, nearbyCoords?.lng, nearbyError],
      getItemKey: (provider) => provider.id,
      enabled: !geolocationPending,
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
    const missingIds = providers
      .map((s) => s.id)
      .filter((id) => servicesMap[id] === undefined)

    if (missingIds.length === 0) return

    let cancelled = false
    async function loadServices() {
      const idsToFetch = [...missingIds]
      const entries = await Promise.allSettled(
        idsToFetch.map((id) => serviceApi.getActiveByProvider(id)),
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
  }, [providers])

  // Aplatir les prestataires en services
  const allServices = useMemo(() => {
    const list: { service: ProviderServiceResponse; provider: ProviderResponse }[] = []
    providers.forEach(provider => {
      const providerServices = servicesMap[provider.id] || []
      providerServices.forEach(service => {
        list.push({ service, provider })
      })
    })
    return list
  }, [providers, servicesMap])

  const filteredServices = useMemo(() => {
    return allServices
      .filter(({ service, provider }) => {
        if (!search) return true
        const query = search.toLowerCase()
        const specName = (provider.displayName ?? `${provider.firstName} ${provider.lastName}`).toLowerCase()
        const specTitle = (provider.profileTitle ?? '').toLowerCase()
        const svcName = service.name.toLowerCase()
        return specName.includes(query) || specTitle.includes(query) || svcName.includes(query)
      })
      .filter(({ provider }) => {
        if (filter === 'top-rated') return (provider.averageRating ?? 0) >= 4
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
            placeholder="Ex: 'Massage', 'Coupe', 'Rakoto'…"
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
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
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

      {geolocationPending ? (
        <div className="flex items-center justify-center gap-3 py-24">
          <Spinner size={28} />
          <span className="text-sm text-muted">Récupération de votre position…</span>
        </div>
      ) : loading && !nearbyError ? (
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
            {filteredServices.map(({ service, provider }, index) => (
              <ServiceCard
                key={`${provider.id}-${service.id}`}
                service={service}
                provider={provider}
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
