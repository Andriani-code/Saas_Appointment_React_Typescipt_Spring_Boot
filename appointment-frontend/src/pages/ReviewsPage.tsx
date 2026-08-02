import { useState, useEffect, useCallback } from "react";
import { Star, Search, MessageSquare, Filter } from "lucide-react";
import { reviewApi, reservationApi, providerApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Spinner, EmptyState, StarRating, Avatar } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils";
import type { ReviewResponse, ReservationResponse } from "@/types";
import { cn } from "@/utils";
import toast from "react-hot-toast";

type Tab = "received" | "given";

export function ReviewsPage() {
  const { hasRole } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [completedReservations, setCompletedReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(hasRole("PROVIDER") ? "received" : "given");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (hasRole("CLIENT")) {
        const data = await reviewApi.getMyReviews(0, 50);
        setReviews(data.content);

        const resData = await reservationApi.getMyAsClient(0, 50);
        setCompletedReservations(
          resData.content.filter((r) => r.status === "COMPLETED"),
        );
      } else if (hasRole("PROVIDER")) {
        const exists = await providerApi.existsProfile();
        if (!exists) {
          setReviews([]);
          setCompletedReservations([]);
          setTab("received");
          return;
        }

        const provider = await providerApi.getMe();
        const data = await reviewApi.getByProvider(provider.id, 0, 50);
        setReviews(data.content);
        setCompletedReservations([]);
        setTab("received");
      } else {
        setReviews([]);
        setCompletedReservations([]);
      }
    } catch {
      toast.error("Erreur lors du chargement des avis");
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReservation) return;
    setSubmitting(true);
    const toastId = toast.loading("Publication de votre avis...");
    try {
      await reviewApi.create({
        reservationId: selectedReservation,
        rating,
        comment,
      });
      toast.success("Merci ! Votre avis a été publié.", { id: toastId });
      setShowModal(false);
      setSelectedReservation("");
      setRating(5);
      setComment("");
      loadData();
    } catch {
      toast.error("Erreur lors de la publication", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.comment?.toLowerCase().includes(q) ||
      r.clientFullName.toLowerCase().includes(q) ||
      (r.providerDisplayName ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    average:
      reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : "0",
    total: reviews.length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl font-black uppercase tracking-tighter">
            Avis & Notes
          </h1>
          <p className="text-muted mt-1 text-sm font-medium">
            {hasRole("PROVIDER")
              ? "Gérez votre réputation en ligne"
              : "Consultez et rédigez vos avis"}
          </p>
        </div>
        {hasRole("CLIENT") && (
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-2xl shadow-lg shadow-primary/20"
            icon={<Star size={16} />}
          >
            Donner un avis
          </Button>
        )}
      </div>

      {hasRole("PROVIDER") && tab === "received" && reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down">
          <div className="card p-6 flex flex-col items-center justify-center text-center border-none shadow-sm bg-background rounded-3xl">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">
              Note Moyenne
            </p>
            <div className="text-5xl font-display font-black text-primary leading-none">
              {stats.average}
            </div>
            <div className="flex justify-center mt-3">
              <StarRating rating={parseFloat(stats.average)} size={18} />
            </div>
          </div>
          <div className="card p-6 flex flex-col items-center justify-center text-center border-none shadow-sm bg-background rounded-3xl">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">
              Total Avis
            </p>
            <div className="text-5xl font-display font-black text-text leading-none">
              {stats.total}
            </div>
            <p className="text-xs text-muted font-bold mt-3 uppercase tracking-tighter">
              Retours clients
            </p>
          </div>
        </div>
      )}

      {hasRole("PROVIDER") && (
        <div className="flex gap-2 p-1.5 bg-surface rounded-2xl w-fit">
          <button
            onClick={() => setTab("received")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              tab === "received" ? "bg-background text-text shadow-sm" : "text-muted hover:text-text"
            )}
          >
            Avis reçus
          </button>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="text"
          placeholder="Rechercher dans les commentaires..."
          className="w-full bg-background border-surface rounded-2xl pl-12 pr-6 py-3 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={32} />}
          title="Aucun avis trouvé"
          description="Les avis s'afficheront ici."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="card p-6 bg-background border-none shadow-sm hover:shadow-md transition-all rounded-3xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={tab === "received" ? review.clientFullName : review.providerDisplayName || "S"}
                      size="md"
                      className="rounded-xl"
                    />
                    <div>
                      <p className="font-bold text-text text-sm leading-tight">
                        {tab === "received" ? review.clientFullName : review.providerDisplayName}
                      </p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary/5 px-2 py-1 rounded-lg">
                    <StarRating rating={review.rating} size={14} />
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute -left-2 -top-2 text-4xl text-primary/10 font-serif font-black">
                    "
                  </span>
                  <p className="text-sm text-text/80 leading-relaxed relative z-10 pl-2">
                    {review.comment || "Aucun commentaire laissé."}
                  </p>
                </div>
              </div>

              {!review.isVisible && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-accent bg-accent/10 w-fit px-2 py-1 rounded-md">
                  <Filter size={10} /> En attente de modération
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 rounded-none bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-[12px] w-full max-w-md p-8 animate-slide-up shadow-2xl">
            <h2 className="text-2xl font-display font-black text-text mb-2">
              Laisser un avis
            </h2>
            <p className="text-muted text-sm mb-6 font-medium">
              Partagez votre expérience avec le prestataire.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                  Le rendez-vous
                </label>
                <select
                  value={selectedReservation}
                  onChange={(e) => setSelectedReservation(e.target.value)}
                  className="w-full bg-surface border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold text-text"
                  required
                >
                  <option value="">Sélectionnez un service...</option>
                  {completedReservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.serviceName} - {r.providerDisplayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center">
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-3">
                  Votre note
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-all hover:scale-125"
                    >
                      <Star
                        size={36}
                        className={cn(
                          "transition-colors",
                          star <= rating ? "text-accent fill-accent" : "text-border"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                  Commentaire
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comment s'est passée votre prestation ?"
                  rows={4}
                  className="w-full bg-surface border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none placeholder:text-muted/60"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl py-3 font-bold border-surface"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  loading={submitting}
                  disabled={!selectedReservation}
                  className="rounded-2xl py-3 font-bold shadow-lg shadow-primary/20"
                >
                  Publier l'avis
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
