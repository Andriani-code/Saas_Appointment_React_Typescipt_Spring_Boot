import { Link } from 'react-router-dom'
import { MapPin, Clock, Star, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar, StarRating } from '@/components/ui'
import { formatCurrency } from '@/utils'
import type { SpecialistResponse, SpecialistServiceResponse } from '@/types'

interface SpecialistCardProps {
  specialist: SpecialistResponse
  services?:  SpecialistServiceResponse[]
  distance?:  number
  delay?:     number
}

export function SpecialistCard({ specialist, services = [], distance, delay = 0 }: SpecialistCardProps) {
  const minPrice = services.length > 0
    ? Math.min(...services.map(s => s.price))
    : null

  const name = specialist.displayName
    ?? `${specialist.firstName} ${specialist.lastName}`

  return (
    <div
      className="card-hover p-5 animate-slide-up flex flex-col gap-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar name={name} src={specialist.profilePhoto} size="lg" />
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-surface" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-text text-base leading-tight truncate">{name}</h3>
              <p className="text-sm text-primary font-medium mt-0.5">
                {specialist.profileTitle ?? 'Spécialiste'}
              </p>
            </div>
            {distance !== undefined && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-muted bg-soft px-2 py-0.5 rounded-full">
                <MapPin size={10} />
                {distance.toFixed(1)} km
              </span>
            )}
          </div>

          {specialist.averageRating !== undefined && (
            <div className="mt-1.5">
              <StarRating rating={specialist.averageRating} size={13} />
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {specialist.bio && (
        <p className="text-sm text-muted line-clamp-2 leading-relaxed">
          {specialist.bio}
        </p>
      )}

      {/* Services chips */}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {services.slice(0, 3).map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-soft text-muted px-2.5 py-1 rounded-full">
              <Clock size={10} />
              {s.name} · {s.durationMinutes}min
            </span>
          ))}
          {services.length > 3 && (
            <span className="text-xs text-primary font-medium px-2 py-1">+{services.length - 3}</span>
          )}
        </div>
      )}

      {/* Address */}
      {specialist.serviceAddress && (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={12} className="text-primary shrink-0" />
          {specialist.serviceAddress.city}
          {specialist.serviceAddress.district && `, ${specialist.serviceAddress.district}`}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
        <div>
          {minPrice !== null ? (
            <>
              <p className="text-[10px] text-muted uppercase font-semibold tracking-wide">À partir de</p>
              <p className="font-display font-bold text-lg text-text">{formatCurrency(minPrice)}</p>
            </>
          ) : (
            <p className="text-sm text-muted italic">Tarif sur demande</p>
          )}
        </div>
        <Link to={`/specialists/${specialist.id}`}>
          <Button size="sm" icon={<Calendar size={14} />}>
            Réserver
          </Button>
        </Link>
      </div>
    </div>
  )
}
