import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Edit, Trash2, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { availabilityApi, slotApi, providerApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Spinner, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import type { AvailabilityResponse, DayOfWeek } from "@/types";
import { cn } from "@/utils";

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "MONDAY", label: "Lundi", short: "Lun" },
  { value: "TUESDAY", label: "Mardi", short: "Mar" },
  { value: "WEDNESDAY", label: "Mercredi", short: "Mer" },
  { value: "THURSDAY", label: "Jeudi", short: "Jeu" },
  { value: "FRIDAY", label: "Vendredi", short: "Ven" },
  { value: "SATURDAY", label: "Samedi", short: "Sam" },
  { value: "SUNDAY", label: "Dimanche", short: "Dim" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`)
  .concat(Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:30`))
  .sort();

const INTERVALS = [15, 30, 45, 60, 90, 120];

export function AvailabilityPage() {
  const { hasRole } = useAuthStore();
  const [availabilities, setAvailabilities] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("MONDAY");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [intervalMinutes, setIntervalMinutes] = useState(30);

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

  function openModal(avail?: AvailabilityResponse) {
    if (avail) {
      setEditingId(avail.id);
      setDayOfWeek(avail.dayOfWeek);
      setStartTime(avail.startTime.slice(0, 5));
      setEndTime(avail.endTime.slice(0, 5));
      setIntervalMinutes(avail.intervalMinutes);
    } else {
      setEditingId(null);
      setDayOfWeek("MONDAY");
      setStartTime("09:00");
      setEndTime("17:00");
      setIntervalMinutes(30);
    }
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        dayOfWeek,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        intervalMinutes,
      };

      if (editingId) {
        await availabilityApi.update(editingId, data);
        toast.success("Horaire mis à jour");
      } else {
        await availabilityApi.create(data);
        toast.success("Horaire ajouté");
      }

      setShowModal(false);
      loadAvailabilities();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet horaire ?")) return;
    try {
      await availabilityApi.delete(id);
      toast.success("Horaire supprimé");
      loadAvailabilities();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  const handleGenerateSlots = async () => {
    if (!confirm("Voulez-vous générer vos créneaux pour les 30 prochains jours ?")) return;

    setGenerating(true);
    const toastId = toast.loading("Génération des créneaux...");
    try {
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await slotApi.generate(startDate, endDate);
      toast.success("Créneaux générés avec succès pour les 30 prochains jours !", { id: toastId });
    } catch {
      toast.error("Erreur lors de la génération des créneaux", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const availabilitiesByDay = DAYS.reduce(
    (acc, day) => {
      acc[day.value] = availabilities.filter((a) => a.dayOfWeek === day.value);
      return acc;
    },
    {} as Record<DayOfWeek, AvailabilityResponse[]>,
  );

  if (!hasRole("PROVIDER")) {
    return (
      <EmptyState
        icon={<Clock size={28} />}
        title="Accès restreint"
        description="Cette page est réservée aux prestataires."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Disponibilités</h1>
          <p className="text-muted mt-1 text-sm">Définissez vos horaires de travail</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => openModal()} disabled={!hasProfile}>
          Ajouter un horaire
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <CalendarDays size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-text text-sm">Comment ça marche ?</p>
              <div className="text-xs text-muted mt-1 space-y-1">
                <p>1. Définissez vos horaires hebdomadaires ci-dessous.</p>
                <p>2. Cliquez sur "Générer les créneaux" pour les rendre réservables sur le calendrier.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 border-amber-300 bg-amber-100/60">
          <div className="flex items-center justify-between gap-4 h-full">
            <div>
              <p className="font-medium text-amber-900 text-sm">Prêt à recevoir des clients ?</p>
              <p className="text-xs text-amber-700 mt-1">Mettez à jour votre calendrier pour les 30 prochains jours.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              loading={generating}
              onClick={handleGenerateSlots}
              disabled={!hasProfile}
              className="border-amber-400 text-amber-900 hover:bg-amber-200 shrink-0"
            >
              Générer les créneaux
            </Button>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => {
            const dayAvails = availabilitiesByDay[day.value];
            const isActive = dayAvails.length > 0 && dayAvails.some((a) => a.isActive);

            return (
              <div
                key={day.value}
                className={cn("card p-4 transition-all", isActive ? "border-primary/30 bg-primary/5" : "opacity-75")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-gray-300")} />
                    <span className="font-semibold text-text">{day.label}</span>
                  </div>
                  <button
                    onClick={() => {
                      setDayOfWeek(day.value);
                      openModal();
                    }}
                    className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    aria-label={`Ajouter une disponibilité pour ${day.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {dayAvails.length === 0 ? (
                  <p className="text-sm text-muted">Non disponible</p>
                ) : (
                  <div className="space-y-2">
                    {dayAvails.map((avail) => (
                      <div key={avail.id} className="flex items-center justify-between p-2 bg-soft rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-primary" />
                          <span className="text-text">
                            {avail.startTime.slice(0, 5)} - {avail.endTime.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openModal(avail)}
                            className="p-1 text-muted hover:text-primary transition-colors"
                            aria-label={`Modifier la disponibilité du ${day.label} de ${avail.startTime.slice(0, 5)} à ${avail.endTime.slice(0, 5)}`}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(avail.id)}
                            className="p-1 text-muted hover:text-danger transition-colors"
                            aria-label={`Supprimer la disponibilité du ${day.label} de ${avail.startTime.slice(0, 5)} à ${avail.endTime.slice(0, 5)}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-display text-xl font-bold text-text mb-4">
              {editingId ? "Modifier l'horaire" : "Ajouter un horaire"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Jour de la semaine</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                  className="w-full bg-soft border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Heure de début</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-soft border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Heure de fin</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-soft border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Intervalle (minutes)</label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                  className="w-full bg-soft border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none"
                >
                  {INTERVALS.map((i) => (
                    <option key={i} value={i}>{i} minutes</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" fullWidth loading={submitting}>{editingId ? "Enregistrer" : "Ajouter"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
