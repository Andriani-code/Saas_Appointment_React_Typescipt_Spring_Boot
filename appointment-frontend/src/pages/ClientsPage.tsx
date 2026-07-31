import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";
import { reservationApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Avatar, Spinner, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate, formatTime } from "@/utils";
import type { ReservationResponse } from "@/types";
import { Link } from "react-router-dom";

interface Client {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  photo?: string;
  reservationCount: number;
  lastReservation?: string;
  upcomingReservation?: ReservationResponse;
}

export function ClientsPage() {
  const { hasRole } = useAuthStore();
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadReservations = useCallback(async () => {
    if (!hasRole("PROVIDER")) return;
    setLoading(true);
    try {
      const data = await reservationApi.getMyAsProvider(0, 100);
      setReservations(data.content);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Grouper les réservations par client
  const clientsMap = reservations.reduce(
    (acc, r) => {
      if (!acc[r.clientId]) {
        acc[r.clientId] = {
          id: r.clientId,
          fullName: r.clientFullName,
          email: "", // À récupérer depuis le client endpoint
          reservationCount: 0,
          lastReservation: r.createdAt,
          upcomingReservation: undefined,
        };
      }
      acc[r.clientId].reservationCount++;
      if (
        new Date(r.createdAt) > new Date(acc[r.clientId].lastReservation || "")
      ) {
        acc[r.clientId].lastReservation = r.createdAt;
      }
      if (r.status === "CONFIRMED" && !acc[r.clientId].upcomingReservation) {
        acc[r.clientId].upcomingReservation = r;
      }
      return acc;
    },
    {} as Record<string, Client>,
  );

  const clients = Object.values(clientsMap);

  const filtered = clients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  });

  if (!hasRole("PROVIDER")) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title="Accès restreint"
        description="Cette page est réservée aux prestataires."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Mes clients</h1>
          <p className="text-muted mt-1 text-sm">
            Gérez vos clients et leur historique
          </p>
        </div>
        <div className="text-sm text-muted">
          <span className="font-semibold text-text">{clients.length}</span>{" "}
          client{clients.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher un client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Aucun client"
          description="Vos clients apparaîtront ici après leurs premiers rendez-vous."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="card p-5 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-4">
                <Avatar name={client.fullName} src={client.photo} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate">
                    {client.fullName}
                  </h3>
                  <p className="text-sm text-muted truncate">{client.email}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted flex items-center gap-1.5">
                    <Calendar size={14} className="text-primary" />
                    Rendez-vous
                  </span>
                  <span className="font-medium text-text">
                    {client.reservationCount}
                  </span>
                </div>
                {client.lastReservation && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted flex items-center gap-1.5">
                      <ChevronRight size={14} className="text-primary" />
                      Dernier
                    </span>
                    <span className="text-muted">
                      {formatDate(client.lastReservation)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Link to={`/messages?client=${client.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    icon={<MessageSquare size={14} />}
                  >
                    Message
                  </Button>
                </Link>
                {client.upcomingReservation && (
                  <Link
                    to={`/appointments`}
                    className="flex-1"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      icon={<Calendar size={14} />}
                    >
                      Détails
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
