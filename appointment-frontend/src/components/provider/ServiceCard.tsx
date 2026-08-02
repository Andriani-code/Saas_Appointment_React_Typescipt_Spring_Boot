import { Link } from 'react-router-dom'
import { memo } from 'react'
import { MapPin, Clock, Calendar, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar, StarRating } from '@/components/ui'
import { formatCurrency, formatDuration } from '@/utils'
import type { ProviderResponse, ProviderServiceResponse } from '@/types'

interface ServiceCardProps {
  service: ProviderServiceResponse
  provider: ProviderResponse
  delay?: number
}

export const ServiceCard = memo(function ServiceCard({ service, provider, delay = 0 }: ServiceCardProps) {
  const providerName = provider.displayName
    ?? `${provider.firstName} ${provider.lastName}`

  return (
    <div
      className="card-hover p-0 animate-slide-up flex flex-col overflow-hidden border-none shadow-sm bg-background"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Service Image/Cover */}
      <div className="h-32 relative overflow-hidden shrink-0">
        {service.photoUrl ? (
          <>
            <img src={service.photoUrl} alt={service.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
            />
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
           <h3 className="text-text font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm">
             {service.name}
           </h3>
        </div>
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
           <p className="text-xs font-black text-primary">{formatCurrency(service.price)}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-4">
        {/* Provider Mini Info */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar name={providerName} src={provider.profilePhoto} size="sm" className="rounded-xl ring-2 ring-soft" />
            {provider.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-background rounded-full p-0.5 border-2 border-background">
                <ShieldCheck size={8} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text truncate">{providerName}</p>
            <div className="flex items-center gap-2">
               {provider.averageRating !== undefined && (
                 <StarRating rating={provider.averageRating} size={10} />
               )}
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-2">
           {service.description && (
             <p className="text-xs text-muted line-clamp-2 leading-relaxed h-8">
               {service.description}
             </p>
           )}
           
           <div className="flex items-center gap-3 pt-1">
             <div className="flex items-center gap-1 text-[10px] text-muted font-medium bg-soft px-2 py-1 rounded-lg">
                <Clock size={12} className="text-primary" />
                <span>{formatDuration(service.durationMinutes)}</span>
             </div>
             {provider.serviceAddress && (
               <div className="flex items-center gap-1 text-[10px] text-muted font-medium bg-soft px-2 py-1 rounded-lg truncate max-w-[140px]">
                  <MapPin size={12} className="text-primary" />
                  <span className="truncate">{provider.serviceAddress.city}</span>
               </div>
             )}
           </div>
        </div>

        {/* Action */}
        <div className="mt-auto pt-2 border-t border-border/50">
          <Link to={`/providers/${provider.id}?serviceId=${service.id}`} className="block">
            <Button fullWidth size="sm" icon={<Calendar size={14} />} className="rounded-xl">
              Réserver maintenant
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
});
