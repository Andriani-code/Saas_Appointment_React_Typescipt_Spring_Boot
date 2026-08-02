import { Navigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const stats = [
  { n: '2 400+', label: 'Prestataires' },
  { n: '18 000+', label: 'Clients' },
  { n: '4.9★', label: 'Note moyenne' },
]

const features = [
  {
    icon: <Calendar size={22} />,
    title: 'Réservation en ligne',
    desc: 'Vos clients réservent vos prestations 24h/24, sans appel ni relance. Chaque créneau est confirmé en temps réel.',
  },
  {
    icon: <Clock size={22} />,
    title: 'Disponibilités maîtrisées',
    desc: 'Définissez vos plages horaires et vos intervalles. Votre agenda reste à jour automatiquement.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Paiement sécurisé',
    desc: 'Encaissez acomptes et prestations en ligne en toute sécurité, directement depuis la plateforme.',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Messagerie intégrée',
    desc: 'Échangez avec vos clients avant et après le rendez-vous, sans quitter l’application.',
  },
]

const steps = [
  {
    icon: <UserPlus size={20} />,
    title: 'Créez votre compte',
    desc: 'Inscrivez-vous en 3 étapes : choisissez votre rôle, complétez votre profil puis validez votre compte.',
  },
  {
    icon: <Search size={20} />,
    title: 'Trouvez votre prestataire',
    desc: 'Parcourez l’annuaire, comparez les notes et les tarifs, puis réservez la prestation qui vous convient.',
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Profitez de votre RDV',
    desc: 'Recevez une confirmation instantanée, suivez vos rendez-vous et payez en toute sécurité.',
  },
]

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 rounded-none bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo/logo_for_bg_dark.png"
              alt="HILA"
              className="w-9 h-9 object-contain"
            />
            <span className="font-display text-xl font-bold text-text">HILA</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '#fonctionnalites', label: 'Fonctionnalités' },
              { href: '#fonctionnement', label: 'Comment ça marche' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link to="/login">
              <Button variant="ghost" size="md">
                Se connecter
              </Button>
            </Link>
            <Link to="/register">
              <Button size="md" icon={<UserPlus size={15} />}>
                S’inscrire
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-primary/5" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-text leading-tight">
                Réservez vos rendez-vous{' '}
                <span className="text-accent">en toute simplicité</span>
              </h1>
              <p className="text-muted text-base lg:text-lg leading-relaxed max-w-xl">
                HILA connecte clients et prestataires : recherchez une
                prestation, consultez les disponibilités et réservez en
                quelques secondes — ou ouvrez votre agenda et laissez vos
                clients vous trouver.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register">
                <Button size="lg" iconRight={<ArrowRight size={18} />}>
                  Commencer
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Trouver un prestataire
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:gap-4 pt-2 max-w-lg">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-background border border-border rounded-2xl p-4 text-center shadow-card"
                >
                  <p className="font-display text-xl lg:text-2xl font-bold text-primary">
                    {s.n}
                  </p>
                  <p className="text-muted text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden lg:flex justify-center">
            <div className="w-full max-w-md space-y-4">
              <div className="card-hover p-6 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                    AR
                  </div>
                  <div>
                    <p className="font-semibold text-text text-sm">Andry Rakoto</p>
                    <p className="text-xs text-primary font-medium">Dermatologue</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted bg-soft px-2 py-1 rounded-full">
                    <Star size={11} className="text-accent" fill="currentColor" />
                    4.9
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                  <MapPin size={13} className="text-primary" />
                  Antananarivo, Analamanga
                </div>
              </div>

              <div
                className="bg-primary text-white rounded-2xl p-6 shadow-primary animate-slide-up"
                style={{ animationDelay: '120ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-widest">
                  <Calendar size={14} />
                  Rendez-vous confirmé
                </div>
                <p className="font-display text-2xl font-bold mt-3">
                  Consultation — Lun 10 août
                </p>
                <p className="text-text/70 text-sm mt-1">14h30 · 30 min</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="bg-background/15 px-3 py-1.5 rounded-full font-semibold">
                    Payé · 50 000 Ar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="bg-surface/60 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text">
              Tout ce qu’il faut pour gérer vos rendez-vous
            </h2>
            <p className="text-muted mt-3">
              Que vous soyez client ou prestataire, HILA simplifie chaque
              étape de la réservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="card-hover p-6">
                <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-text text-base">{f.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="fonctionnement">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text">
              Comment ça marche ?
            </h2>
            <p className="text-muted mt-3">
              Trois étapes suffisent pour réserver votre prochain rendez-vous.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step, index) => (
              <div key={step.title} className="relative card-hover p-6">
                <span className="absolute top-6 right-6 font-display text-4xl font-bold text-primary/10">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-text text-base">{step.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              Prêt à simplifier vos rendez-vous ?
            </h2>
            <p className="text-white/70">
              Rejoignez HILA gratuitement et commencez dès aujourd’hui.
            </p>
          </div>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-accent text-white hover:bg-accent/90"
              iconRight={<ArrowRight size={18} />}
            >
              Créer mon compte
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo/logo_for_bg_dark.png"
              alt="HILA"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-bold text-text">HILA</span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link to="/login" className="hover:text-primary transition-colors">
              Connexion
            </Link>
            <Link to="/register" className="hover:text-primary transition-colors">
              Inscription
            </Link>
          </nav>

          <p className="text-xs text-muted">© 2026 HILA. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
