import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, UserCheck } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { cn } from '@/utils'
import type { Role, AuthUser } from '@/types'

const roles: { value: Role; label: string; desc: string; icon: string }[] = [
  { value: 'CLIENT',     label: 'Client',      desc: 'Je cherche un spécialiste',  icon: '👤' },
  { value: 'SPECIALIST', label: 'Spécialiste',  desc: 'Je propose des consultations', icon: '🩺' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState<Role>('CLIENT')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setError('')
    setLoading(true)
    try {
      const data = await authApi.register({ email, password, role })
      const user: AuthUser = { email: data.email, role: data.role, accessToken: data.accessToken, refreshToken: data.refreshToken }
      login(user)
      navigate('/dashboard')
    } catch {
      setError("Cet email est déjà utilisé.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] bg-background flex m-20">
      {/* Left decorative */}
      <div className="hidden lg:flex rounded-tl-xl rounded-bl-xl lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary to-primary-400 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/8" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-lg">📅</span>
          </div>
          <span className="font-display text-2xl font-bold text-white">BookDoc</span>
        </div>

        <div className="relative z-10 space-y-5">
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Rejoignez la plateforme<br />de santé numérique
          </h1>
          <p className="text-white/75 text-lg">
            Des milliers de professionnels et patients vous font déjà confiance.
          </p>
          <ul className="space-y-3">
            {['Réservation instantanée 24/7', 'Rappels automatiques', 'Historique complet', 'Messagerie intégrée'].map(f => (
              <li key={f} className="flex items-center gap-3 text-white/85">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/40 text-sm">© 2026 BookDoc. Tous droits réservés.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center bg-surface rounded-tr-xl rounded-br-xl justify-center px-6 py-12 animate-fade-in">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-sm">📅</div>
            <span className="font-display text-xl font-bold text-text">BookDoc</span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-text">Créer un compte</h2>
            <p className="mt-2 text-muted">Rejoignez le plateforme en quelques secondes.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  'border-2 rounded-2xl p-4 text-left transition-all duration-200',
                  role === r.value
                    ? 'border-primary bg-primary/5 shadow-card-hover'
                    : 'border-border bg-surface hover:border-primary/40'
                )}
              >
                <span className="text-2xl">{r.icon}</span>
                <p className={cn('font-semibold text-sm mt-2', role === r.value ? 'text-primary' : 'text-text')}>{r.label}</p>
                <p className="text-xs text-muted mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Adresse e-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com" icon={<Mail size={16} />} required />
            <Input label="Mot de passe" type={showPwd ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum"
              icon={<Lock size={16} />}
              hint="Au moins 8 caractères"
              iconRight={
                <button type="button" onClick={() => setShowPwd(p => !p)} className="text-muted hover:text-text transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              } required />

            <Button type="submit" fullWidth loading={loading} size="lg" icon={<UserCheck size={16} />}>
              Créer mon compte
            </Button>
          </form>

          <p className="text-center text-sm text-muted">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-primary-600 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
