import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, EmptyState, Spinner, StarRating } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { favoriteApi } from '@/services/api'
import type { FavoriteResponse } from '@/types'
import { getErrorMessage } from '@/utils'

export function FavoritesPage() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  async function loadFavorites() {
    setLoading(true)
    setError(null)
    try {
      setFavorites(await favoriteApi.getMy())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFavorites()
  }, [])

  async function handleRemove(favorite: FavoriteResponse) {
    if (removingIds.has(favorite.providerId)) return
    setRemovingIds((prev) => new Set(prev).add(favorite.providerId))
    try {
      await favoriteApi.remove(favorite.providerId)
      setFavorites((prev) =>
        prev.filter((item) => item.providerId !== favorite.providerId),
      )
      toast.success('Retiré de vos favoris')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(favorite.providerId)
        return next
      })
    }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Mes prestataires favoris</h1>
          <p className="text-muted mt-1">
            Retrouvez vos prestataires préférés en un clin d'œil
          </p>
        </div>
        {favorites.length > 0 && (
          <Button
            variant="outline"
            onClick={() => navigate('/providers')}
            icon={<Heart size={15} />}
          >
            <span className="hidden sm:inline">
              Découvrir d'autres prestataires
            </span>
            <span className="sm:hidden">Découvrir</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <EmptyState
          icon={<Heart size={28} />}
          title="Chargement impossible"
          description="Vos favoris n'ont pas pu être récupérés pour le moment."
        />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Heart size={28} />}
          title="Aucun prestataire favori"
          description="Ajoutez des prestataires à vos favoris pour les retrouver rapidement ici."
          action={
            <Button size="sm" onClick={() => navigate('/providers')}>
              Trouver un prestataire
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((favorite, index) => {
            const removing = removingIds.has(favorite.providerId)
            return (
              <div
                key={favorite.providerId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/providers/${favorite.providerId}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/providers/${favorite.providerId}`)
                  }
                }}
                className="card-hover p-6 animate-slide-up flex flex-col gap-4 rounded-[24px] min-h-[220px] shadow-[0_18px_45px_-20px_rgba(2,6,23,0.75)] hover:shadow-[0_24px_55px_-18px_rgba(2,6,23,0.9)] hover:-translate-y-1 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                style={{
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <Avatar
                      name={favorite.providerDisplayName}
                      src={favorite.providerProfilePhoto}
                      size="lg"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-surface" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text text-base leading-tight truncate">
                      {favorite.providerDisplayName}
                    </h3>
                    <p className="text-sm text-primary font-medium mt-0.5">
                      {favorite.providerProfileTitle ?? 'Prestataire'}
                    </p>
                    {favorite.providerAverageRating !== undefined && (
                      <div className="mt-1.5">
                        <StarRating
                          rating={favorite.providerAverageRating}
                          size={13}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted mt-auto">
                  {favorite.providerCategory ? (
                    <>
                      <MapPin size={12} className="text-primary shrink-0" />
                      <span className="truncate capitalize">
                        {favorite.providerCategory}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted/60">Prestataire vérifié</span>
                  )}
                </div>

                <div className="border-t border-border/50 pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleRemove(favorite)
                    }}
                    disabled={removing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 transition-colors disabled:opacity-50"
                    title="Retirer des favoris"
                    aria-label={`Retirer ${favorite.providerDisplayName} des favoris`}
                  >
                    <Heart size={13} fill="currentColor" />
                    {removing ? 'Retrait…' : 'Retirer'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
