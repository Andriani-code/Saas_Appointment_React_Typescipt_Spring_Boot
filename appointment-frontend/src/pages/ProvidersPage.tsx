import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { MapPin, Search, X, LayoutGrid, MapIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { ServiceCard } from '@/components/provider/ServiceCard'
import { ProvidersMap } from '@/components/provider/ProvidersMap'
import { Button } from '@/components/ui/Button'
import { EmptyState, Spinner } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch'
import { serviceApi, providerApi } from '@/services/api'
import type { ProviderResponse, ProviderServiceResponse } from '@/types'

type Filter = 'all' | 'nearby' | 'top-rated'
type View = 'list' | 'map'

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
  const [view, setView] = useState<View>('list')
  const initialErrorShown = useRef(false)

  // While the browser is still asking for geolocation, we keep showing a
  // spinner instead of flashing an error.
  const geolocationPending = filter === 'nearby' && !nearbyCoords && !nearbyError
  const locatingOnMap = view === 'map' && filter === 'nearby' && !nearbyCoords && !nearbyError

  const fetchProviders = useCallback((page: number, size: number) => {
    const useNearby = filter === 'nearby' && nearbyCoords
    if (useNearby) {
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
      deps: [filter, view, nearbyCoords?.lat, nearbyCoords?.lng, nearbyError],
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
  }, [filter, search, view])

  // La vue carte est en "À proximité" par défaut : on bascule le filtre
  // sélectionné dès qu'on passe en vue carte. Le filtre "Tous" permet
  // ensuite d'afficher l'ensemble des prestataires (monde entier).
  useEffect(() => {
    if (view === 'map') {
      setFilter('nearby')
    }
  }, [view])

  useEffect(() => {
    const shouldLocate = filter === 'nearby'
    if (!shouldLocate) {
      setNearbyError(null)
      return
    }
    // Position déjà obtenue — rien à re-demandé.
    if (nearbyCoords) return
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
  }, [filter, view, nearbyCoords])

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

  // Prestataires uniques issus des services filtrés, pour le marquage sur la carte.
  const mapProviders = useMemo(() => {
    const byId = new Map<string, { provider: ProviderResponse; serviceCount: number; minPrice: number }>()
    filteredServices.forEach(({ service, provider }) => {
      const existing = byId.get(provider.id)
      if (existing) {
        existing.serviceCount += 1
        if (service.price < existing.minPrice) existing.minPrice = service.price
      } else {
        byId.set(provider.id, { provider, serviceCount: 1, minPrice: service.price })
      }
    })
    return Array.from(byId.values())
  }, [filteredServices])

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
        <div className="flex items-center gap-1 rounded-full bg-surface border border-border p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`
              inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors
              ${view === 'list'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-primary'
              }
            `}
          >
            <LayoutGrid size={15} />
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={`
              inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors
              ${view === 'map'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-primary'
              }
            `}
          >
            <MapIcon size={15} />
            <span className="hidden sm:inline">Carte</span>
          </button>
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
          {view === 'map' ? (
            <>
              <span className="font-semibold text-text">{mapProviders.length}</span> prestataire{mapProviders.length !== 1 ? 's' : ''} localisé{mapProviders.length !== 1 ? 's' : ''} sur la carte
            </>
          ) : (
            <>
              <span className="font-semibold text-text">{filteredServices.length}</span> prestation{filteredServices.length !== 1 ? 's' : ''} trouvée{filteredServices.length !== 1 ? 's' : ''}
            </>
          )}
        </p>
      )}

      {geolocationPending ? (
        <div className="flex items-center justify-center gap-3 py-24">
          <Spinner size={28} />
          <span className="text-sm text-muted">Récupération de votre position…</span>
        </div>
      ) : view === 'map' ? (
        <div className="relative">
          {(locatingOnMap || (filter === 'nearby' && loading && !nearbyCoords && !nearbyError)) && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full bg-white/95 border border-border shadow-md px-4 py-1.5 text-xs font-medium text-text">
              <Spinner size={14} />
              Récupération de votre position…
            </div>
          )}
          {nearbyError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full bg-white/95 border border-border shadow-md px-4 py-1.5 text-xs font-medium text-muted">
              <MapPin size={13} />
              Géolocalisation indisponible — affichage de tous les prestataires
            </div>
          )}
          <ProvidersMap providers={mapProviders} userLocation={nearbyCoords ?? undefined} />
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
