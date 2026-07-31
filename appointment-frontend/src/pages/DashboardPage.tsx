import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { reservationApi } from "@/services/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge, Avatar, Spinner, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime, formatCurrency } from "@/utils";
import type { ReservationResponse } from "@/types";

export function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (hasRole("CLIENT")) {
          const data = await reservationApi.getMyAsClient(0, 5);
          setReservations(data.content);
        } else if (hasRole("PROVIDER")) {
          const data = await reservationApi.getMyAsProvider(0, 5);
          setReservations(data.content);
        }
      } catch {
        /* no-op */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hasRole]);

  const displayName = user?.email?.split("@")[0] ?? "Utilisateur";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const stats = [
    {
      title: "Rendez-vous",
      value: reservations.length,
      icon: <Calendar size={20} />,
      trend: 5.9,
      color: "orange" as const,
    },
    {
      title: "Confirmés",
      value: reservations.filter((r) => r.status === "CONFIRMED").length,
      icon: <Clock size={20} />,
      trend: 2.1,
      color: "blue" as const,
    },
    {
      title: "Terminés",
      value: reservations.filter((r) => r.status === "COMPLETED").length,
      icon: <Users size={20} />,
      trend: -1.4,
      color: "green" as const,
    },
    {
      title: hasRole("PROVIDER") ? "Revenus" : "En attente",
      value: hasRole("PROVIDER") 
        ? formatCurrency(reservations.filter(r => r.status === 'COMPLETED').reduce((acc, r) => acc + (r.depositAmount || 0), 0))
        : reservations.filter((r) => r.status === "PENDING").length,
      icon: <DollarSign size={20} />,
      trend: 8.2,
      color: "purple" as const,
    },
  ];

  // Mock revenue data for chart
  const revenueData = [
    { day: 'Lun', val: 45 },
    { day: 'Mar', val: 78 },
    { day: 'Mer', val: 52 },
    { day: 'Jeu', val: 95 },
    { day: 'Ven', val: 64 },
    { day: 'Sam', val: 32 },
    { day: 'Dim', val: 15 },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">
            {greeting},{" "}
            <span className="text-primary capitalize">{displayName}</span>
          </h1>
          <p className="text-muted mt-1 text-sm">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {hasRole("CLIENT") && (
          <Link to="/providers">
            <Button
              icon={<Calendar size={16} />}
              iconRight={<ArrowRight size={14} />}
            >
              <span className="hidden sm:inline">Prendre rendez-vous</span>
              <span className="sm:hidden">Réserver</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} delay={i * 80} />
        ))}
      </div>

      {hasRole("PROVIDER") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up animation-delay-200">
           <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-bold text-text">Activité hebdomadaire</h3>
                  <p className="text-xs text-muted">Évolution de vos revenus</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Revenus estimés
                  </div>
                </div>
              </div>
              
              <div className="h-48 flex items-end justify-between gap-2 px-2">
                {revenueData.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-primary/10 group-hover:bg-primary/20 rounded-t-lg transition-all duration-500 relative flex items-end justify-center"
                      style={{ height: `${d.val}%`, transitionDelay: `${i * 50}ms` }}
                    >
                       <div className="w-2/3 bg-primary rounded-t-md mb-0 shadow-lg shadow-primary/20" style={{ height: '70%' }} />
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-text text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none font-bold">
                         {d.val * 10}€
                       </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted uppercase">{d.day}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-text">Conseil du jour</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  Pensez à mettre à jour vos créneaux pour la semaine prochaine pour maximiser vos réservations et revenus.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                 <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted">Profil complété</span>
                    <span className="font-bold text-primary">85%</span>
                 </div>
                 <div className="w-full h-2 bg-soft rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Recent appointments table */}
      <div className="card p-0 overflow-hidden animate-slide-up animation-delay-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-4 border-b border-border">
          <div>
            <h2 className="section-title">Activité récente</h2>
            <p className="text-sm text-muted mt-0.5">
              Vos derniers rendez-vous
            </p>
          </div>
          <Link to="/appointments">
            <Button
              variant="ghost"
              size="sm"
              iconRight={<ChevronRight size={14} />}
            >
              Voir tout
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="Aucun rendez-vous pour l'instant"
            description={
              hasRole("CLIENT")
                ? "Réservez votre premier rendez-vous"
                : "Vos réservations apparaîtront ici"
            }
            action={
              hasRole("CLIENT") ? (
                <Link to="/providers">
                  <Button size="sm">Trouver un prestataire</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-soft border-b border-border">
                  {hasRole("PROVIDER") ? (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Client
                    </th>
                  ) : (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Prestataire
                    </th>
                  )}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                    Service
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                    Heure
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-soft/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={
                            hasRole("PROVIDER")
                              ? r.clientFullName
                              : (r.providerDisplayName ?? "Prestataire")
                          }
                          size="sm"
                        />
                        <span className="font-medium text-sm text-text">
                          {hasRole("PROVIDER")
                            ? r.clientFullName
                            : (r.providerDisplayName ?? "—")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {r.serviceName}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {formatDate(r.slot.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted font-mono">
                      {formatTime(r.slot.startTime)} –{" "}
                      {formatTime(r.slot.endTime)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions for providers */}
      {hasRole("PROVIDER") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up animation-delay-400">
          {[
            {
              to: "/services",
              emoji: "🩺",
              title: "Mes services",
              desc: "Gérer vos offres",
            },
            {
              to: "/appointments",
              emoji: "📅",
              title: "Rendez-vous",
              desc: "Voir le planning",
            },
            {
              to: "/messages",
              emoji: "💬",
              title: "Messages",
              desc: "Lire les messages",
            },
          ].map((action) => (
            <Link key={action.to} to={action.to}>
              <div className="card-hover p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                  {action.emoji}
                </div>
                <div>
                  <p className="font-semibold text-text">{action.title}</p>
                  <p className="text-sm text-muted">{action.desc}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted ml-auto shrink-0"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
