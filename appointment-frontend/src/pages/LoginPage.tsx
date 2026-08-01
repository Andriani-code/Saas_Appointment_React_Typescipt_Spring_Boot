import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login({
        email: data.email,
        role: data.role,
        profileCompleted: data.profileCompleted,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[90vh] bg-background flex ml-20 mr-20 mt-6">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary rounded-tl-xl rounded-bl-xl relative overflow-hidden flex-col justify-between p-8 xl:p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo/logo_for_bg_light.png" alt="HILA" className="w-10 h-10 rounded-2xl object-contain" />
            <span className="font-display text-2xl font-bold text-white">
              HILA
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-3xl xl:text-4xl font-bold text-white leading-tight">
            Gérez vos rendez-vous
            <br />
            en toute simplicité
          </h1>
          <p className="text-white/75 text-base xl:text-lg leading-relaxed">
            Connectez-vous pour accéder à votre espace et gérer vos
            rendez-vous avec vos prestataires.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 xl:gap-4 pt-4">
            {[
              { n: "2 400+", label: "Prestataires" },
              { n: "18 000+", label: "Clients" },
              { n: "4.9★", label: "Note moyenne" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 rounded-xl xl:rounded-2xl p-3 xl:p-4 text-center"
              >
                <p className="font-display text-xl xl:text-2xl font-bold text-white">
                  {s.n}
                </p>
                <p className="text-white/65 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-sm">
          © 2026 HILA. Tous droits réservés.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <img src="/logo/logo_for_bg_light.png" alt="HILA" className="w-8 h-8 rounded-xl object-contain" />
            <span className="font-display text-2xl font-bold text-text">
              HILA
            </span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-text">
              Connexion
            </h2>
            <p className="mt-2 text-muted">
              Ravi de vous revoir. Entrez vos identifiants.
            </p>
          </div>

          {error && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 text-sm text-accent animate-slide-down whitespace-pre-line">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="••••••••"
              icon={<Lock size={16} />}
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary w-4 h-4"
                />
                <span className="text-muted">Se souvenir de moi</span>
              </label>
              <a
                href="#"
                className="text-primary font-medium hover:text-primary-600 transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-muted">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:text-primary-600 transition-colors"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
