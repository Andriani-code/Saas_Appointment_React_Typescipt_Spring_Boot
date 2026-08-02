import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import type { AddressResponse } from '@/types'

interface LocationMapProps {
  address?: AddressResponse
  className?: string
}

function buildAddressLabel(address: AddressResponse): string {
  const parts = [
    address.addressLine,
    address.district,
    address.city,
    address.region,
    address.country,
  ].filter((part): part is string => Boolean(part?.trim()))
  return parts.join(', ')
}

function openInMaps(address: AddressResponse) {
  if (
    address.latitude !== undefined &&
    address.longitude !== undefined
  ) {
    window.open(
      `https://www.openstreetmap.org/?mlat=${address.latitude}&mlon=${address.longitude}#map=16/${address.latitude}/${address.longitude}`,
      '_blank',
      'noopener,noreferrer'
    )
  }
}

export function LocationMap({ address, className }: LocationMapProps) {
  if (!address) return null

  const hasCoordinates =
    address.latitude !== undefined && address.longitude !== undefined
  const label = buildAddressLabel(address)

  const embedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${address.longitude! - 0.008}%2C${address.latitude! - 0.008}%2C${address.longitude! + 0.008}%2C${address.latitude! + 0.008}&layer=mapnik&marker=${address.latitude}%2C${address.longitude}`
    : ''

  return (
    <div className={className}>
      <div className="flex items-start gap-2">
        <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-medium text-text text-sm">{label}</p>
          {hasCoordinates && (
            <p className="text-xs text-muted mt-0.5">
              {address.latitude!.toFixed(6)}, {address.longitude!.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      {hasCoordinates && (
        <div className="mt-3 rounded-xl overflow-hidden border border-border">
          <iframe
            title="Localisation du service"
            src={embedUrl}
            className="w-full h-48 bg-surface"
            loading="lazy"
          />
        </div>
      )}

      {hasCoordinates && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => openInMaps(address)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Navigation size={13} />
            Ouvrir dans OpenStreetMap
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(
                `https://www.google.com/maps?q=${address.latitude},${address.longitude}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ExternalLink size={13} />
            Google Maps
          </button>
        </div>
      )}
    </div>
  )
}
