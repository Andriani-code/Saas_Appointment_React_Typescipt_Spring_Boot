import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react";
import { authApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils";
import type { RegisterRequest, Role } from "@/types";

type SignupRole = Exclude<Role, "ADMIN">;
type Step = "role" | "profile" | "account";

const roles: {
  value: SignupRole;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "CLIENT",
    label: "Client",
    desc: "Je cherche un spécialiste",
    icon: <User size={18} />,
  },
  {
    value: "SPECIALIST",
    label: "Spécialiste",
    desc: "Je propose des consultations",
    icon: <Stethoscope size={18} />,
  },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<SignupRole>("CLIENT");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [bio, setBio] = useState("");
  const [serviceCountry, setServiceCountry] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceRegion, setServiceRegion] = useState("");
  const [serviceAddressLine, setServiceAddressLine] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validateProfileStep() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Le profil doit contenir au moins le prénom et le nom.");
      return false;
    }

    if ((country.trim() && !city.trim()) || (!country.trim() && city.trim())) {
      setError("Pour l'adresse, renseigne au moins le pays et la ville ensemble.");
      return false;
    }

    if (
      role === "SPECIALIST" &&
      ((serviceCountry.trim() && !serviceCity.trim()) ||
        (!serviceCountry.trim() && serviceCity.trim()))
    ) {
      setError("Pour l'adresse de service, renseigne au moins le pays et la ville ensemble.");
      return false;
    }

    return true;
  }

  function goToProfileStep() {
    setError("");
    setStep("profile");
  }

  function goToAccountStep() {
    setError("");
    if (!validateProfileStep()) return;
    setStep("account");
  }

  function buildRegisterPayload(): RegisterRequest {
    const payload: RegisterRequest = {
      email,
      password,
      role,
    };

    if (role === "CLIENT") {
      payload.clientProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        address:
          country.trim() && city.trim()
            ? {
                country: country.trim(),
                city: city.trim(),
                region: region.trim() || undefined,
                addressLine: addressLine.trim() || undefined,
              }
            : undefined,
      };
    }

    if (role === "SPECIALIST") {
      payload.specialistProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        displayName: displayName.trim() || undefined,
        profileTitle: profileTitle.trim() || undefined,
        bio: bio.trim() || undefined,
        personalAddress:
          country.trim() && city.trim()
            ? {
                country: country.trim(),
                city: city.trim(),
                region: region.trim() || undefined,
                addressLine: addressLine.trim() || undefined,
              }
            : undefined,
        serviceAddress:
          serviceCountry.trim() && serviceCity.trim()
            ? {
                country: serviceCountry.trim(),
                city: serviceCity.trim(),
                region: serviceRegion.trim() || undefined,
                addressLine: serviceAddressLine.trim() || undefined,
              }
            : undefined,
      };
    }

    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (!validateProfileStep()) {
      setStep("profile");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await authApi.register(buildRegisterPayload());
      login({
        email: data.email,
        role: data.role,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      navigate("/dashboard");
    } catch {
      setError("Inscription impossible. Vérifie les champs ou utilise un autre email.");
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = step === "role" ? 0 : step === "profile" ? 1 : 2;

  return (
    <div className="min-h-[90vh] bg-background flex mr-20 ml-20 mt-6 ">
      <div className="hidden lg:flex rounded-tl-xl rounded-bl-xl lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary to-primary-400 relative overflow-hidden flex-col justify-between p-8 xl:p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/8" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"
                fill="white"
              />
            </svg>
          </div>
          <span className="font-display text-2xl font-bold text-white">BookDoc</span>
        </div>

        <div className="relative z-10 space-y-5">
          <h1 className="font-display text-3xl xl:text-4xl font-bold text-white leading-tight">
            Inscription en 3 étapes
          </h1>
          <p className="text-white/75 text-base xl:text-lg">
            Choisissez d'abord votre rôle, complétez votre profil, puis créez votre compte.
          </p>
        </div>

        <p className="relative z-10 text-white/40 text-sm">© 2026 BookDoc. Tous droits réservés.</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-7">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-text">BookDoc</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Rôle", "Profil", "Compte"].map((label, index) => (
              <div key={label} className="space-y-2">
                <div className={cn("h-2 rounded-full", index <= stepIndex ? "bg-primary" : "bg-primary/20")} />
                <p className={cn("text-xs font-semibold", index <= stepIndex ? "text-text" : "text-muted")}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-text">
              {step === "role" ? "Choisissez votre rôle" : step === "profile" ? "Complétez votre profil" : "Créez votre compte"}
            </h2>
            <p className="mt-2 text-muted">
              {step === "role"
                ? "Sélectionnez le type de compte à créer."
                : step === "profile"
                  ? "Renseignez les informations du profil avant de continuer."
                  : "Ajoutez maintenant l'email et le mot de passe."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-slide-down">
              {error}
            </div>
          )}

          {step === "role" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "border-2 rounded-2xl p-5 text-left transition-all duration-200",
                      role === r.value
                        ? "border-primary bg-primary/5 shadow-card-hover"
                        : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <p className={cn("font-semibold text-sm mt-2", role === r.value ? "text-primary" : "text-text")}>
                      {r.label}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>

              <Button type="button" fullWidth size="lg" iconRight={<ChevronRight size={16} />} onClick={goToProfileStep}>
                Continuer
              </Button>
            </div>
          )}

          {step === "profile" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Andry"
                  required
                />
                <Input
                  label="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Rakoto"
                  required
                />
              </div>

              <Input
                label="Téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+261 34 00 000 00"
                icon={<Phone size={16} />}
              />

              {role === "SPECIALIST" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nom affiché"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Dr. Rakoto"
                    />
                    <Input
                      label="Titre professionnel"
                      value={profileTitle}
                      onChange={(e) => setProfileTitle(e.target.value)}
                      placeholder="Ex: Dermatologue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      placeholder="Décrivez votre activité..."
                      className="w-full bg-soft border border-border rounded-xl px-4 py-3 text-sm text-text focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none resize-none"
                    />
                  </div>
                </>
              )}

              <div className="rounded-2xl border border-border p-4 space-y-4">
                <p className="font-semibold text-sm text-text flex items-center gap-2">
                  <MapPin size={16} />
                  {role === "CLIENT" ? "Adresse personnelle" : "Adresse personnelle (optionnelle)"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Pays"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ex: Madagascar"
                  />
                  <Input
                    label="Ville"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Antananarivo"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Région"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Ex: Analamanga"
                  />
                  <Input
                    label="Adresse"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Ex: Lot II A 123"
                  />
                </div>
              </div>

              {role === "SPECIALIST" && (
                <div className="rounded-2xl border border-border p-4 space-y-4">
                  <p className="font-semibold text-sm text-text flex items-center gap-2">
                    <MapPin size={16} />
                    Adresse de service
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Pays"
                      value={serviceCountry}
                      onChange={(e) => setServiceCountry(e.target.value)}
                      placeholder="Ex: Madagascar"
                    />
                    <Input
                      label="Ville"
                      value={serviceCity}
                      onChange={(e) => setServiceCity(e.target.value)}
                      placeholder="Ex: Antananarivo"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Région"
                      value={serviceRegion}
                      onChange={(e) => setServiceRegion(e.target.value)}
                      placeholder="Ex: Analamanga"
                    />
                    <Input
                      label="Adresse"
                      value={serviceAddressLine}
                      onChange={(e) => setServiceAddressLine(e.target.value)}
                      placeholder="Ex: Cabinet 12"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" fullWidth icon={<ChevronLeft size={16} />} onClick={() => setStep("role")}>
                  Retour
                </Button>
                <Button type="button" fullWidth iconRight={<ChevronRight size={16} />} onClick={goToAccountStep}>
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {step === "account" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                icon={<Mail size={16} />}
                required
              />

              <Input
                label="Mot de passe"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                icon={<Lock size={16} />}
                hint="Au moins 8 caractères"
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    className="text-muted hover:text-text transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" fullWidth icon={<ChevronLeft size={16} />} onClick={() => setStep("profile")}>
                  Retour
                </Button>
                <Button type="submit" fullWidth loading={loading} size="lg" icon={<UserCheck size={16} />}>
                  Créer mon compte
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted">
            Déjà un compte ?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:text-primary-600 transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
