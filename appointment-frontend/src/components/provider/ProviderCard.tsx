import { Link } from 'react-router-dom'
import { MapPin, Clock, Star, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar, StarRating } from '@/components/ui'
import { formatCurrency } from '@/utils'
import type { ProviderResponse, ProviderServiceResponse } from '@/types'

interface ProviderCardProps {
  provider: ProviderResponse
  services?:  ProviderServiceResponse[]
  distance?:  number
  delay?:     number
}

export function ProviderCard({ provider, services = [], distance, delay = 0 }: ProviderCardProps) {
  const minPrice = services.length > 0
    ? Math.min(...services.map(s => s.price))
    : null

  const name = provider.displayName
    ?? `${provider.firstName} ${provider.lastName}`

  return (
    <div
      className="card-hover p-5 animate-slide-up flex flex-col gap-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar name={name} src={provider.profilePhoto} size="lg" />
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-surface" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-text text-base leading-tight truncate">{name}</h3>
              <p className="text-sm text-primary font-medium mt-0.5">
                {provider.profileTitle ?? 'Prestataire'}
              </p>
            </div>
            {distance !== undefined && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-muted bg-soft px-2 py-0.5 rounded-full">
                <MapPin size={10} />
                {distance.toFixed(1)} km
              </span>
            )}
          </div>

          {provider.averageRating !== undefined && (
            <div className="mt-1.5">
              <StarRating rating={provider.averageRating} size={13} />
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {provider.bio && (
        <p className="text-sm text-muted line-clamp-2 leading-relaxed">
          {provider.bio}
        </p>
      )}

      {/* Services list with direct booking */}
      {services.length > 0 ? (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Services disponibles</p>
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <Link 
                key={s.id} 
                to={`/providers/${provider.id}?serviceId=${s.id}`}
                className="flex items-center justify-between p-2 rounded-xl bg-soft hover:bg-primary/5 group/service transition-all border border-transparent hover:border-primary/10"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text truncate group-hover/service:text-primary transition-colors">{s.name}</p>
                  <p className="text-[10px] text-muted">{s.durationMinutes} min</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-primary">{formatCurrency(s.price)}</p>
                  <div className="flex items-center gap-1 text-[9px] text-muted justify-end">
                    <Calendar size={10} />
                    <span>Réserver</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 pt-3">
           <p className="text-[10px] text-muted">Aucun service configuré pour le moment</p>
        </div>
      )}

      {/* Address */}
      {provider.serviceAddress && (
        <div className="flex items-center gap-1.5 text-xs text-muted mt-auto">
          <MapPin size={12} className="text-primary shrink-0" />
          <span className="truncate">{provider.serviceAddress.city}{provider.serviceAddress.district ? `, ${provider.serviceAddress.district}` : ''}</span>
        </div>
      )}
    </div>
  )
}
