import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import type { ProviderResponse } from '@/types'
import { formatCurrency } from '@/utils'
import { StarRating } from '@/components/ui'

// Icône personnalisée pour les marqueurs (les icônes par défaut de Leaflet
// ne se chargent pas correctement sous Vite).
const providerIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 34px; height: 34px;
      border-radius: 9999px;
      background: #A97147;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
})

const selectedIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 44px; height: 44px;
      border-radius: 9999px;
      background: #E8C083;
      border: 3px solid #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#573824" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
})

// Icône pour la position de l'utilisateur.
const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 22px; height: 22px;
      border-radius: 9999px;
      background: #3b82f6;
      border: 4px solid #fff;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.35);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

interface MapProvider {
  provider: ProviderResponse
  serviceCount: number
  minPrice?: number
}

interface ProvidersMapProps {
  providers: MapProvider[]
  onSelectProvider?: (provider: ProviderResponse) => void
  selectedId?: string
  userLocation?: { lat: number; lng: number }
  className?: string
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
    } else {
      map.fitBounds(
        L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [50, 50] },
      )
    }
    setInitialized(true)
  }, [map, points])

  useEffect(() => {
    if (initialized && points.length === 0) {
      map.setView([-18.8792, 47.5079], 6)
    }
  }, [map, initialized, points.length])

  return null
}

export function ProvidersMap({ providers, onSelectProvider, selectedId, userLocation, className }: ProvidersMapProps) {
  const withCoords = providers.filter(
    (p) =>
      p.provider.serviceAddress?.latitude !== undefined &&
      p.provider.serviceAddress?.longitude !== undefined,
  )

  const coordinates = withCoords.map((p) => ({
    lat: p.provider.serviceAddress!.latitude!,
    lng: p.provider.serviceAddress!.longitude!,
  }))

  const fitPoints = userLocation ? [...coordinates, userLocation] : coordinates

  if (withCoords.length === 0 && !userLocation) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <MapPin size={28} className="text-muted" />
          <p className="text-sm text-muted">
            Aucun prestataire avec une position géographique pour ces critères.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : [-18.8792, 47.5079]}
        zoom={userLocation ? 12 : 6}
        scrollWheelZoom={false}
        className="w-full h-[480px] z-0 rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={fitPoints} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1000}>
            <Popup>
              <p className="text-sm font-semibold text-text">Votre position</p>
            </Popup>
          </Marker>
        )}
        {withCoords.map(({ provider, serviceCount, minPrice }) => {
          const lat = provider.serviceAddress!.latitude!
          const lng = provider.serviceAddress!.longitude!
          const name = provider.displayName ?? `${provider.firstName} ${provider.lastName}`
          const isSelected = provider.id === selectedId
          return (
            <Marker
              key={provider.id}
              position={[lat, lng]}
              icon={isSelected ? selectedIcon : providerIcon}
              eventHandlers={{
                click: () => onSelectProvider?.(provider),
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1.5">
                  <p className="font-bold text-text text-sm">{name}</p>
                  {provider.profileTitle && (
                    <p className="text-xs text-primary">{provider.profileTitle}</p>
                  )}
                  {provider.averageRating !== undefined && (
                    <StarRating rating={provider.averageRating} size={12} />
                  )}
                  {provider.serviceAddress && (
                    <p className="text-[11px] text-muted flex items-center gap-1">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">
                        {provider.serviceAddress.city}
                        {provider.serviceAddress.district ? `, ${provider.serviceAddress.district}` : ''}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    {serviceCount} prestation{serviceCount > 1 ? 's' : ''}
                    {minPrice !== undefined ? ` · dès ${formatCurrency(minPrice)}` : ''}
                  </p>
                  <Link
                    to={`/providers/${provider.id}`}
                    className="block text-center text-xs font-semibold bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary-hover transition-colors"
                  >
                    Voir le profil
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
