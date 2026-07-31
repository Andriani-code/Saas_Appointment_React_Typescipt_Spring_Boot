import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { paymentApi, reservationApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Spinner, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/utils";
import type { PaymentResponse, ReservationResponse } from "@/types";
import { cn } from "@/utils";

type Tab = "all" | "pending" | "success" | "failed";

export function PaymentsPage() {
  const { hasRole } = useAuthStore();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load reservations and filter those with payments
      const role = hasRole("CLIENT") ? "client" : "provider";
      const data =
        role === "client"
          ? await reservationApi.getMyAsClient(0, 50)
          : await reservationApi.getMyAsProvider(0, 50);

      setReservations(data.content.filter((r) => r.depositRequired));

      // For now, we'll show reservations with deposits as payments
      // In a real app, you'd have a dedicated payments endpoint
      const paymentsData: PaymentResponse[] = data.content
        .filter((r) => r.depositRequired)
        .map((r) => ({
          id: r.id,
          reservationId: r.id,
          amount: r.depositAmount || 0,
          method: "card",
          status:
            r.status === "COMPLETED"
              ? "SUCCESS"
              : r.status === "CANCELED" ||
                  r.status === "REJECTED" ||
                  r.status === "NO_SHOW"
                ? "FAILED"
                : "PENDING",
          createdAt: r.createdAt,
        }));
      setPayments(paymentsData);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = payments
    .filter((p) => tab === "all" || p.status.toLowerCase() === tab)
    .filter((p) => {
      if (!search) return true;
      const reservation = reservations.find((r) => r.id === p.reservationId);
      const q = search.toLowerCase();
      return (
        reservation?.serviceName.toLowerCase().includes(q) ||
        reservation?.clientFullName.toLowerCase().includes(q)
      );
    });

  const stats = {
    total: payments.reduce((acc, p) => acc + p.amount, 0),
    pending: payments
      .filter((p) => p.status === "PENDING")
      .reduce((acc, p) => acc + p.amount, 0),
    success: payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((acc, p) => acc + p.amount, 0),
    failed: payments
      .filter((p) => p.status === "FAILED")
      .reduce((acc, p) => acc + p.amount, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle size={16} className="text-green-600" />;
      case "FAILED":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-amber-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "Payé";
      case "FAILED":
        return "Échoué";
      default:
        return "En attente";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="text-muted mt-1 text-sm">
            Gérez vos transactions et dépôts
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <DollarSign size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="font-display font-bold text-text">
                {formatCurrency(stats.total)}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted">En attente</p>
              <p className="font-display font-bold text-text">
                {formatCurrency(stats.pending)}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Payés</p>
              <p className="font-display font-bold text-text">
                {formatCurrency(stats.success)}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Échoués</p>
              <p className="font-display font-bold text-text">
                {formatCurrency(stats.failed)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1 overflow-x-auto">
        {[
          { value: "all", label: "Tous" },
          { value: "pending", label: "En attente" },
          { value: "success", label: "Payés" },
          { value: "failed", label: "Échoués" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as Tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-text",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher par service ou client..."
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
          icon={<CreditCard size={28} />}
          title="Aucun paiement"
          description={
            tab === "all"
              ? "Aucun paiement trouvé."
              : `Aucun paiement avec le statut "${tab}".`
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => {
            const reservation = reservations.find(
              (r) => r.id === payment.reservationId,
            );
            return (
              <div
                key={payment.id}
                className="card p-4 flex items-center gap-4"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    payment.status === "SUCCESS"
                      ? "bg-green-50"
                      : payment.status === "FAILED"
                        ? "bg-red-50"
                        : "bg-amber-50",
                  )}
                >
                  {payment.status === "SUCCESS" ? (
                    <ArrowUpRight size={20} className="text-green-600" />
                  ) : payment.status === "FAILED" ? (
                    <ArrowDownLeft size={20} className="text-red-600" />
                  ) : (
                    <Clock size={20} className="text-amber-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">
                    {reservation?.serviceName || "Service"}
                  </p>
                  <p className="text-sm text-muted">
                    {hasRole("CLIENT")
                      ? reservation?.providerDisplayName
                      : reservation?.clientFullName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display font-bold text-text">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    {getStatusIcon(payment.status)}
                    <span
                      className={cn(
                        "text-xs",
                        payment.status === "SUCCESS"
                          ? "text-green-600"
                          : payment.status === "FAILED"
                            ? "text-red-600"
                            : "text-amber-600",
                      )}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
