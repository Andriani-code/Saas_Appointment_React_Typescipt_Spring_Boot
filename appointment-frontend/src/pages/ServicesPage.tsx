import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertTriangle,
  ShieldCheck,
  Image,
  Upload,
} from "lucide-react";
import { serviceApi, providerApi, uploadApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Spinner, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDuration } from "@/utils";
import type {
  ProviderServiceResponse,
  ProviderServiceRequest,
  ProviderResponse,
} from "@/types";
import { cn } from "@/utils";
import toast from "react-hot-toast";

export function ServicesPage() {
  const { hasRole } = useAuthStore();
  const [services, setServices] = useState<ProviderServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ProviderServiceResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState<ProviderResponse | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(0);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (!hasRole("PROVIDER")) return;
    setLoading(true);
    try {
      const exists = await providerApi.existsProfile();
      setHasProfile(exists);

      if (!exists) {
        setProvider(null);
        setServices([]);
        return;
      }

      const specData = await providerApi.getMe();
      setProvider(specData);
      const data = await serviceApi.getActiveByProvider(specData.id);
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openModal(service?: ProviderServiceResponse) {
    setPhotoFile(null);
    setPhotoPreview(undefined);
    if (service) {
      setEditingService(service);
      setName(service.name);
      setDescription(service.description || "");
      setPhotoUrl(service.photoUrl);
      setDurationMinutes(service.durationMinutes);
      setPrice(service.price);
      setDepositEnabled(service.depositEnabled);
      setDepositAmount(service.depositAmount || 0);
    } else {
      setEditingService(null);
      setName("");
      setDescription("");
      setPhotoUrl(undefined);
      setDurationMinutes(30);
      setPrice(0);
      setDepositEnabled(false);
      setDepositAmount(0);
    }
    setShowModal(true);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadApi.uploadImage(photoFile, "services");
      }

      const data: ProviderServiceRequest = {
        name,
        description: description || undefined,
        photoUrl: finalPhotoUrl,
        durationMinutes,
        price,
        depositEnabled,
        depositAmount: depositEnabled ? depositAmount : undefined,
      };

      if (editingService) {
        await serviceApi.update(editingService.id, data);
        toast.success("Service mis à jour");
      } else {
        await serviceApi.create(data);
        toast.success("Service créé");
      }

      setShowModal(false);
      loadData();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;
    try {
      await serviceApi.deactivate(id);
      toast.success("Service supprimé");
      loadData();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  const filtered = services.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
  });

  if (!hasRole("PROVIDER")) {
    return (
      <EmptyState
        icon={<DollarSign size={28} />}
        title="Accès restreint"
        description="Cette page est réservée aux prestataires."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Mes services</h1>
          <p className="text-muted mt-1 text-sm">Gérez les prestations que vous proposez</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => openModal()} disabled={!hasProfile}>
          Nouveau service
        </Button>
      </div>

      {provider && !provider.isVerified && (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-start gap-4 animate-slide-down shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-accent" size={20} />
          </div>
          <div>
            <p className="text-accent font-bold text-sm">Profil non vérifié</p>
            <p className="text-accent text-xs mt-1 leading-relaxed">
              Vos services sont actuellement <strong>masqués</strong> pour les clients.
              Ils ne deviendront visibles que lorsque votre profil aura été vérifié et approuvé par un administrateur.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-accent hover:bg-accent/20 p-0 h-auto font-bold text-xs"
              onClick={() => (window.location.href = "/settings")}
            >
              Aller demander la vérification &rarr;
            </Button>
          </div>
        </div>
      )}

      {provider?.isVerified && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-accent" size={20} />
          </div>
          <div>
            <p className="text-accent font-bold text-sm">Profil vérifié</p>
            <p className="text-accent text-xs mt-1">
              Félicitations ! Votre profil est vérifié. Vos services sont visibles et prêts à être réservés.
            </p>
          </div>
        </div>
      )}

      <Input
        placeholder="Rechercher un service..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={28} />}
          title={hasProfile ? "Aucun service" : "Profil prestataire requis"}
          description={
            hasProfile
              ? "Créez votre premier service pour commencer à recevoir des clients."
              : "Créez d'abord votre profil prestataire dans les paramètres."
          }
          action={
            hasProfile ? (
              <Button icon={<Plus size={16} />} onClick={() => openModal()}>
                Créer un service
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = "/settings")}>
                Compléter mon profil
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <div key={service.id} className="card p-5 hover:shadow-card-hover transition-shadow">
              {service.photoUrl && (
                <div className="w-full h-36 rounded-xl overflow-hidden mb-4">
                  <img
                    src={service.photoUrl}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-muted mt-1 line-clamp-2">{service.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(service)}
                    className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-1.5 text-muted hover:text-danger hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Clock size={14} className="text-primary" />
                    {formatDuration(service.durationMinutes)}
                  </span>
                  {service.depositEnabled && service.depositAmount && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">
                      Dépôt: {formatCurrency(service.depositAmount)}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium",
                    service.isActive ? "bg-accent/10 text-accent" : "bg-surface text-muted"
                  )}
                >
                  {service.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {service.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-end text-sm">
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <DollarSign size={14} />
                  {formatCurrency(service.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="font-display text-xl font-bold text-text mb-4">
              {editingService ? "Modifier le service" : "Nouveau service"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Nom du service *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Coupe, Massage, Réparation…" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre service..."
                  rows={3}
                  className="w-full bg-soft border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Photo du service</label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-soft border border-border flex items-center justify-center shrink-0">
                    {photoPreview || photoUrl ? (
                      <img
                        src={photoPreview || photoUrl}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image size={24} className="text-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full cursor-pointer border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-xl px-4 py-3 text-sm text-muted hover:text-text transition-colors">
                      <Upload size={15} />
                      {photoFile ? photoFile.name : "Choisir une image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>
                    {(photoFile || photoUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(undefined);
                          setPhotoUrl("");
                        }}
                        className="mt-2 text-xs text-muted hover:text-danger transition-colors"
                      >
                        Retirer la photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Durée (min) *</label>
                  <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)} min={15} step={15} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Prix (Ar) *</label>
                  <Input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} min={0} step={0.01} required />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-soft rounded-xl">
                <div>
                  <p className="font-medium text-text text-sm">Dépôt requis</p>
                  <p className="text-xs text-muted">Paiement à la réservation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositEnabled(!depositEnabled)}
                  className={cn("w-12 h-6 rounded-full transition-colors relative", depositEnabled ? "bg-primary" : "bg-muted/30")}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", depositEnabled ? "left-7" : "left-1")} />
                </button>
              </div>

              {depositEnabled && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Montant du dépôt (Ar)</label>
                  <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)} min={0} step={0.01} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" fullWidth loading={submitting} disabled={!name || price <= 0}>
                  {editingService ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
