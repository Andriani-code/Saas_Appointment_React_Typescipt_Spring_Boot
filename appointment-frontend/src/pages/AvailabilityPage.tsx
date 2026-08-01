import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Trash2, CalendarDays, CalendarOff } from "lucide-react";
import toast from "react-hot-toast";
import { availabilityApi, providerApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Spinner, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import type { AvailabilityResponse } from "@/types";
import { formatDate } from "@/utils";

export function AvailabilityPage() {
  const { hasRole } = useAuthStore();
  const [availabilities, setAvailabilities] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState("");

  const loadAvailabilities = useCallback(async () => {
    if (!hasRole("PROVIDER")) return;
    setLoading(true);
    try {
      const exists = await providerApi.existsProfile();
      setHasProfile(exists);

      if (!exists) {
        setAvailabilities([]);
        return;
      }

      const data = await availabilityApi.getMyAvailabilities();
      setAvailabilities(data);
    } catch {
      toast.error("Erreur lors du chargement des disponibilités");
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    loadAvailabilities();
  }, [loadAvailabilities]);

  function openModal() {
    setDate("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      toast.error("Veuillez choisir une date");
      return;
    }
    setSubmitting(true);
    try {
      await availabilityApi.create({ date });
      toast.success("Date activée");
      setShowModal(false);
      loadAvailabilities();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir désactiver cette date ?")) return;
    try {
      await availabilityApi.delete(id);
      toast.success("Date désactivée");
      loadAvailabilities();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (!hasRole("PROVIDER")) {
    return (
      <EmptyState
        icon={<Clock size={28} />}
        title="Accès restreint"
        description="Cette page est réservée aux prestataires."
      />
    );
  }

  const sorted = [...availabilities].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Disponibilités</h1>
          <p className="text-muted mt-1 text-sm">Activez les dates où vous souhaitez recevoir des clients</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openModal} disabled={!hasProfile}>
          Activer une date
        </Button>
      </div>

      <div className="card p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-text text-sm">Comment ça marche ?</p>
            <div className="text-xs text-muted mt-1 space-y-1">
              <p>1. Activez les dates de votre choix ci-dessous.</p>
              <p>2. Ajoutez ensuite vos créneaux horaires pour chaque date active.</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : !hasProfile ? (
        <EmptyState
          icon={<Clock size={28} />}
          title="Profil prestataire requis"
          description="Créez d'abord votre profil prestataire dans les paramètres."
          action={
            <Button onClick={() => (window.location.href = "/settings")}>
              Compléter mon profil
            </Button>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<CalendarOff size={28} />}
          title="Aucune date active"
          description="Activez une date pour commencer à recevoir des réservations."
          action={
            <Button onClick={openModal} icon={<Plus size={16} />}>
              Activer une date
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((avail) => (
            <div key={avail.id} className="card p-4 border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="font-semibold text-text">{formatDate(avail.date)}</span>
                </div>
                <button
                  onClick={() => handleDelete(avail.id)}
                  className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  aria-label={`Désactiver la date du ${formatDate(avail.date)}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-xs text-muted">
                {new Date(avail.date).toLocaleDateString("fr-FR", { weekday: "long" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-display text-xl font-bold text-text mb-4">Activer une date</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-soft border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" fullWidth loading={submitting}>Activer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
