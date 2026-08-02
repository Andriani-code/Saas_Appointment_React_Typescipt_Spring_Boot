import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
        userId: data.userId,
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
    <AuthLayout
      cardClassName="max-w-md"
      rightAction={
        <Link to="/register">
          <Button variant="outline" size="sm" icon={<UserPlus size={14} />}>
            S'inscrire
          </Button>
        </Link>
      }
    >
      <div className="w-full max-w-md mx-auto space-y-8 px-6 sm:px-10 py-10 xl:py-14">
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
    </AuthLayout>
  );
}
