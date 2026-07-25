import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronRight,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { specialistApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Avatar, Spinner, EmptyState, StarRating } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate, formatCurrency, getErrorMessage } from "@/utils";
import type {
  SpecialistResponse,
  ReservationResponse,
  ReviewResponse,
} from "@/types";
import { cn } from "@/utils";
import toast from "react-hot-toast";

type Tab = "verification" | "specialists" | "reservations" | "reviews";

export function AdminPage() {
  const { hasRole } = useAuthStore();
  const [specialists, setSpecialists] = useState<SpecialistResponse[]>([]);
  const [pending, setPending] = useState<SpecialistResponse[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("verification");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!hasRole("ADMIN")) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [allSpecs, pendingSpecs] = await Promise.all([
        specialistApi.getAllForAdmin(0, 100),
        specialistApi.getPendingForAdmin(0, 100)
      ]);
      setSpecialists(allSpecs.content);
      setPending(pendingSpecs.content);
      setReservations([]);
      setReviews([]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await specialistApi.approve(id);
      toast.success("Spécialiste approuvé !");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Rejeter cette demande de vérification ?")) return;
    setActionLoading(id);
    try {
      await specialistApi.reject(id);
      toast.success("Spécialiste rejeté");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  if (!hasRole("ADMIN")) {
    return (
      <EmptyState
        icon={<Shield size={28} />}
        title="Accès restreint"
        description="Espace réservé à l'administration."
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-text italic uppercase tracking-tighter">Panel Admin</h1>
          <p className="text-muted text-sm font-medium mt-1">Supervision de la plateforme BookDoc</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-text uppercase tracking-widest">Système Live</span>
           </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'En attente', val: pending.length, icon: <Clock className="text-amber-600" />, bg: 'bg-amber-50' },
          { label: 'Spécialistes', val: specialists.length, icon: <Users className="text-primary" />, bg: 'bg-primary/5' },
          { label: 'Réservations', val: reservations.length, icon: <Calendar className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Note moyenne', val: '4.8', icon: <Star className="text-orange-500" />, bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center gap-4 border-none shadow-sm hover:shadow-md transition-all cursor-default">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", s.bg)}>
                {s.icon}
             </div>
             <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{s.label}</p>
                <p className="text-xl font-display font-bold text-text leading-none mt-1">{s.val}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Tabs Design Premium */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
        {[
          { id: 'verification', label: 'Vérifications', count: pending.length, color: 'bg-amber-500' },
          { id: 'specialists', label: 'Annuaire', count: specialists.length, color: 'bg-primary' },
          { id: 'reservations', label: 'Flux Activité', count: null },
          { id: 'reviews', label: 'Modération Avis', count: null },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={cn(
              "px-5 py-2.5 rounded-[14px] text-sm font-bold transition-all flex items-center gap-2",
              tab === t.id ? "bg-white text-text shadow-sm scale-[1.02]" : "text-muted hover:text-text"
            )}
          >
            {t.label}
            {t.count !== null && (
              <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] text-white font-black", tab === t.id ? t.color : "bg-muted")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size={40} />
            <p className="text-muted font-medium animate-pulse">Chargement des données sécurisées...</p>
          </div>
        )}

        {!loading && tab === 'verification' && (
          <div className="grid grid-cols-1 gap-4">
            {pending.length === 0 ? (
              <EmptyState icon={<CheckCircle size={32} />} title="Tout est à jour" description="Aucune demande de vérification en attente." />
            ) : (
              pending.map(s => (
                <div key={s.id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-amber-400">
                  <div className="flex items-center gap-4">
                    <Avatar name={s.displayName || `${s.firstName} ${s.lastName}`} src={s.profilePhoto} size="xl" className="rounded-2xl shadow-lg shadow-black/5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-text leading-tight">{s.displayName || `${s.firstName} ${s.lastName}`}</h3>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Attente</span>
                      </div>
                      <p className="text-xs text-muted font-medium mb-1">Nom légal: {s.firstName} {s.lastName}</p>
                      <p className="text-sm text-primary font-bold">{s.profileTitle || 'Titre non défini'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {s.serviceAddress?.city || 'N/A'}</span>
                        <span className="flex items-center gap-1 font-mono">{s.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button 
                       variant="outline" 
                       className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                       onClick={() => handleReject(s.id)}
                       loading={actionLoading === s.id}
                     >
                       Refuser
                     </Button>
                     <Button 
                       className="rounded-xl shadow-lg shadow-primary/20"
                       onClick={() => handleApprove(s.id)}
                       loading={actionLoading === s.id}
                     >
                       Approuver le profil
                     </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && tab === 'specialists' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Filtrer par nom, email, spécialité..." 
                className="w-full bg-white border-gray-100 rounded-2xl pl-12 pr-6 py-3 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialists.filter(s => `${s.firstName} ${s.lastName} ${s.displayName} ${s.email}`.toLowerCase().includes(search.toLowerCase())).map(s => (
                <div key={s.id} className="card p-4 hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3">
                      <Avatar name={s.displayName || `${s.firstName} ${s.lastName}`} src={s.profilePhoto} size="lg" className="rounded-xl" />
                      <div className="flex-1 min-w-0">
                         <p className="font-bold text-text truncate leading-none mb-1">{s.displayName || `${s.firstName} ${s.lastName}`}</p>
                         <p className="text-[10px] text-muted truncate font-mono uppercase">{s.email}</p>
                      </div>
                      {s.isVerified && <CheckCircle size={16} className="text-green-500" />}
                   </div>
                   <div className="mt-4 flex justify-between items-center">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-md uppercase",
                        s.verificationStatus === 'APPROVED' ? "bg-green-50 text-green-700" :
                        s.verificationStatus === 'REJECTED' ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {s.verificationStatus}
                      </span>
                      <button className="p-1.5 text-muted hover:text-primary transition-colors">
                        <ExternalLink size={14} />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === 'reservations' && (
           <div className="card p-0 overflow-hidden border-none shadow-sm bg-white rounded-3xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-soft/50 text-[10px] font-black text-muted uppercase tracking-widest border-b border-gray-50">
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reservations.map(r => (
                    <tr key={r.id} className="hover:bg-soft/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-text">{r.clientFullName}</td>
                      <td className="px-6 py-4 text-sm text-muted">{r.serviceName}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", 
                          r.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500')}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted font-mono">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}
      </div>
    </div>
  );
}
