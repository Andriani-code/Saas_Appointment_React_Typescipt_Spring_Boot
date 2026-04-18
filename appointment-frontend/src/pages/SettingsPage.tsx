import { useState, useEffect, FormEvent } from 'react'
import { User, MapPin, Phone, Save, Briefcase } from 'lucide-react'
import { clientApi, specialistApi } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui'
import { cn } from '@/utils'

type Tab = 'profile' | 'address' | 'security'

export function SettingsPage() {
  const { user, hasRole } = useAuth()
  const [tab, setTab]         = useState<Tab>('profile')
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [bio,       setBio]       = useState('')
  const [title,     setTitle]     = useState('')
  const [displayName, setDisplayName] = useState('')

  // Address fields
  const [country, setCountry] = useState('')
  const [city,    setCity]    = useState('')
  const [region,  setRegion]  = useState('')
  const [line,    setLine]    = useState('')

  useEffect(() => {
    if (hasRole('CLIENT')) {
      clientApi.getMe().then(c => {
        setFirstName(c.firstName)
        setLastName(c.lastName)
        setPhone(c.phone ?? '')
        setCountry(c.address?.country ?? '')
        setCity(c.address?.city ?? '')
        setRegion(c.address?.region ?? '')
        setLine(c.address?.addressLine ?? '')
      }).catch(() => {})
    } else if (hasRole('SPECIALIST')) {
      specialistApi.getMe().then(s => {
        setFirstName(s.firstName)
        setLastName(s.lastName)
        setPhone(s.phone ?? '')
        setBio(s.bio ?? '')
        setTitle(s.profileTitle ?? '')
        setDisplayName(s.displayName ?? '')
        setCountry(s.serviceAddress?.country ?? '')
        setCity(s.serviceAddress?.city ?? '')
        setRegion(s.serviceAddress?.region ?? '')
        setLine(s.serviceAddress?.addressLine ?? '')
      }).catch(() => {})
    }
  }, [hasRole])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    try {
      const address = { country, city, region, addressLine: line }
      if (hasRole('CLIENT')) {
        await clientApi.updateProfile({ firstName, lastName, phone, address })
      } else if (hasRole('SPECIALIST')) {
        await specialistApi.updateProfile({
          firstName, lastName, phone, bio, profileTitle: title, displayName,
          serviceAddress: address,
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* no-op */ }
    finally { setLoading(false) }
  }

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'profile',  label: 'Profil',    icon: <User size={15} /> },
    { value: 'address',  label: 'Adresse',   icon: <MapPin size={15} /> },
    { value: 'security', label: 'Sécurité',  icon: <Briefcase size={15} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Paramètres</h1>
        <p className="text-muted mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Profile preview */}
      <div className="card p-5 flex items-center gap-4">
        <Avatar name={`${firstName} ${lastName}`.trim() || 'Utilisateur'} size="xl" />
        <div>
          <p className="font-semibold text-text">
            {firstName} {lastName}
          </p>
          <p className="text-sm text-primary">{user?.email}</p>
          <p className="text-xs text-muted mt-0.5 capitalize">
            {user?.role === 'CLIENT' ? 'Patient' : user?.role === 'SPECIALIST' ? 'Spécialiste' : 'Admin'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-soft rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              tab === t.value ? 'bg-surface text-primary shadow-card' : 'text-muted hover:text-text'
            )}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        {tab === 'profile' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              <Input label="Nom"    value={lastName}  onChange={e => setLastName(e.target.value)}  required />
            </div>
            <Input label="Téléphone" value={phone} onChange={e => setPhone(e.target.value)}
              icon={<Phone size={15} />} placeholder="+33 6 00 00 00 00" />
            {hasRole('SPECIALIST') && (
              <>
                <Input label="Nom affiché" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Dr. Jean Martin" />
                <Input label="Titre professionnel" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Cardiologue, Médecin généraliste…" />
                <div>
                  <label className="text-sm font-medium text-text block mb-1.5">Biographie</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    className="input-base resize-none"
                    placeholder="Décrivez votre expérience, vos spécialités…"
                  />
                </div>
              </>
            )}
          </>
        )}

        {tab === 'address' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Pays"   value={country} onChange={e => setCountry(e.target.value)} required />
              <Input label="Région" value={region}  onChange={e => setRegion(e.target.value)} />
            </div>
            <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} required />
            <Input label="Adresse complète" value={line} onChange={e => setLine(e.target.value)}
              placeholder="12 rue de la Paix" icon={<MapPin size={15} />} />
          </>
        )}

        {tab === 'security' && (
          <div className="space-y-4">
            <div className="bg-soft rounded-xl p-4 text-sm text-muted">
              La modification du mot de passe se fait via la procédure de réinitialisation.
            </div>
            <Input label="Email actuel" value={user?.email ?? ''} disabled />
          </div>
        )}

        {tab !== 'security' && (
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="submit" loading={loading} icon={<Save size={15} />}>
              Enregistrer les modifications
            </Button>
            {saved && (
              <span className="text-sm text-green-600 font-medium animate-fade-in">
                ✓ Modifications enregistrées
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
