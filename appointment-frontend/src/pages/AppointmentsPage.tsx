import { useMemo, useState } from "react";
import { Calendar, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AppointmentCard } from "@/components/appointment/AppointmentCard";
import { Button } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { reservationApi } from "@/services/api";
import type { ReservationResponse, ReservationStatus } from "@/types";

type Tab = "all" | ReservationStatus;

const tabs: { value: Tab; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmés" },
  { value: "COMPLETED", label: "Terminés" },
  { value: "CANCELED", label: "Annulés" },
];

export function AppointmentsPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  
  const isSpecialist = hasRole("SPECIALIST");
  const isClient = hasRole("CLIENT");
  const isEnabled = isSpecialist || isClient;

  const {
    items: reservations,
    setItems: setReservations,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<ReservationResponse>(
    (page, size) => {
      if (isSpecialist) return reservationApi.getMyAsSpecialist(page, size);
      if (isClient) return reservationApi.getMyAsClient(page, size);
      // Fallback for ADMIN or other roles who shouldn't be here but might be
      return Promise.resolve({
        content: [],
        page: 0,
        size: size,
        totalElements: 0,
        totalPages: 0,
        last: true
      });
    },
    {
      pageSize: 20,
      deps: [isSpecialist, isClient],
      getItemKey: (reservation) => reservation.id,
      enabled: isEnabled
    },
  );

  function handleUpdate(updated: ReservationResponse) {
    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === updated.id ? updated : reservation,
      ),
    );
  }

  const filtered = useMemo(
    () =>
      reservations
        .filter((reservation) => tab === "all" || reservation.status === tab)
        .filter((reservation) => {
          if (!search) return true;

          const query = search.toLowerCase();
          return (
            reservation.serviceName.toLowerCase().includes(query) ||
            reservation.clientFullName.toLowerCase().includes(query) ||
            (reservation.specialistDisplayName ?? "").toLowerCase().includes(query)
          );
        }),
    [reservations, search, tab],
  );

  const counts = useMemo(
    () =>
      tabs.reduce<Record<Tab, number>>((acc, currentTab) => {
        acc[currentTab.value] =
          currentTab.value === "all"
            ? reservations.length
            : reservations.filter((reservation) => reservation.status === currentTab.value).length;
        return acc;
      }, {} as Record<Tab, number>),
    [reservations],
  );

  async function handleLoadMore() {
    try {
      await loadMore();
    } catch {
      toast.error("Impossible de charger plus de rendez-vous");
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Mes rendez-vous</h1>
          <p className="text-muted mt-1 text-sm">
            Gérez vos consultations en un seul endroit
          </p>
        </div>
        {hasRole("CLIENT") && (
          <Link to="/specialists">
            <Button icon={<Calendar size={15} />}>
              <span className="hidden sm:inline">Nouveau rendez-vous</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Rechercher par spécialiste, service…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      <div className="flex gap-1 lg:gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-border">
        {tabs.map((currentTab) => (
          <button
            key={currentTab.value}
            onClick={() => setTab(currentTab.value)}
            className={`
              flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-t-xl text-sm font-medium
              transition-all duration-200 border-b-2 -mb-px whitespace-nowrap
              ${
                tab === currentTab.value
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted hover:text-text hover:border-border"
              }
            `}
          >
            {currentTab.label}
            {counts[currentTab.value] > 0 && (
              <span
                className={`
                text-xs px-1.5 py-0.5 rounded-full font-semibold
                ${tab === currentTab.value ? "bg-primary text-white" : "bg-soft text-muted"}
              `}
              >
                {counts[currentTab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {!isEnabled ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="Accès non autorisé"
          description="Les administrateurs n'ont pas de liste de rendez-vous personnelle."
        />
      ) : loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="Chargement impossible"
          description="Les rendez-vous n'ont pas pu être récupérés pour le moment."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="Aucun rendez-vous"
          description={
            tab === "all"
              ? "Vous n'avez pas encore de rendez-vous."
              : `Aucun rendez-vous avec le statut "${tabs.find((item) => item.value === tab)?.label}".`
          }
          action={
            hasRole("CLIENT") ? (
              <Link to="/specialists">
                <Button size="sm">Trouver un spécialiste</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((reservation, index) => (
              <AppointmentCard
                key={reservation.id}
                reservation={reservation}
                onUpdate={handleUpdate}
                delay={index * 50}
              />
            ))}
          </div>

          {hasMore && tab === "all" && !search && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                loading={loadingMore}
                aria-label="Charger plus de rendez-vous"
              >
                Charger plus
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
