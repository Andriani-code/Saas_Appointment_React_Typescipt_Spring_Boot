import { useState, useEffect, FormEvent } from 'react'
import { User, MapPin, Phone, Save, Briefcase, AlertCircle, ShieldCheck, Clock as ClockIcon } from 'lucide-react'
import toast from 'react-hot-toast'
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
  const [fetching, setFetching] = useState(true)

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
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [profileExists, setProfileExists] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<string>('NONE')

  useEffect(() => {
    const loadProfile = async () => {
      setFetching(true)
      try {
        if (hasRole('CLIENT')) {
          const exists = await clientApi.existsProfile()
          if (!exists) {
            setProfileExists(false)
            return
          }

          const c = await clientApi.getMe()
          setProfileExists(true)
          setFirstName(c.firstName)
          setLastName(c.lastName)
          setPhone(c.phone ?? '')
          setCountry(c.address?.country ?? '')
          setCity(c.address?.city ?? '')
          setRegion(c.address?.region ?? '')
          setLine(c.address?.addressLine ?? '')
          setLatitude(c.address?.latitude ?? null)
          setLongitude(c.address?.longitude ?? null)
        } else if (hasRole('SPECIALIST')) {
          const exists = await specialistApi.existsProfile()
          if (!exists) {
            setProfileExists(false)
            return
          }

          const s = await specialistApi.getMe()
          setProfileExists(true)
          setVerificationStatus(s.verificationStatus)
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
          setLatitude(s.serviceAddress?.latitude ?? null)
          setLongitude(s.serviceAddress?.longitude ?? null)
        }
      } catch (err) {
        setProfileExists(false)
      } finally {
        setFetching(false)
      }
    }
    loadProfile()
  }, [hasRole])

  const handleRequestVerification = async () => {
    if (!profileExists) {
      toast.error("Veuillez d'abord créer votre profil en enregistrant vos informations.")
      return
    }
    const toastId = toast.loading("Envoi de la demande de vérification...")
    try {
      await specialistApi.requestVerification()
      setVerificationStatus('PENDING')
      toast.success("Demande envoyée avec succès !", { id: toastId })
    } catch (err) {
      toast.error("Erreur lors de l'envoi de la demande", { id: toastId })
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur")
      return
    }

    const toastId = toast.loading("Récupération de votre position et de l'adresse...")
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLatitude(latitude)
        setLongitude(longitude)

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          const data = await response.json()

          if (data.address) {
            const addr = data.address
            setCountry(addr.country || '')
            setCity(addr.city || addr.town || addr.village || addr.municipality || '')
            setRegion(addr.state || addr.province || addr.county || '')
            const street = addr.road || ''
            const houseNumber = addr.house_number || ''
            const fullAddress = `${houseNumber} ${street}`.trim()
            setLine(fullAddress)
            toast.success("Position et adresse récupérées !", { id: toastId })
          } else {
            toast.success("Position récupérée (adresse non trouvée)", { id: toastId })
          }
        } catch (err) {
          toast.success("Position récupérée, mais erreur lors de la recherche d'adresse", { id: toastId })
        }
      },
      () => {
        toast.error("Impossible de récupérer votre position. Vérifiez vos permissions.", { id: toastId })
      }
    )
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!country || !city) {
      toast.error("Veuillez remplir au moins le pays et la ville dans l'onglet Adresse")
      setTab('address')
      return
    }

    setLoading(true)
    const toastId = toast.loading(profileExists ? 'Mise à jour...' : 'Création...')
    
    try {
      const address = { 
        country, city, region, addressLine: line,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined
      }
      
      if (hasRole('CLIENT')) {
        const data = { firstName, lastName, phone, address }
        profileExists ? await clientApi.updateProfile(data) : await clientApi.createProfile(data)
      } else {
        const data = {
          firstName, lastName, phone, bio, profileTitle: title, displayName,
          serviceAddress: address,
        }
        profileExists ? await specialistApi.updateProfile(data) : await specialistApi.createProfile(data)
      }
      
      setProfileExists(true)
      toast.success("Enregistré avec succès !", { id: toastId })
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'profile',  label: 'Profil',    icon: <User size={15} /> },
    { value: 'address',  label: 'Adresse',   icon: <MapPin size={15} /> },
    { value: 'security', label: 'Sécurité',  icon: <Briefcase size={15} /> },
  ]

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Paramètres</h1>
        <p className="text-muted mt-1 text-sm">Gérez vos informations personnelles</p>
      </div>

      {hasRole('SPECIALIST') && profileExists && (
        <div className={cn(
          "rounded-2xl p-4 flex items-center justify-between gap-4 border shadow-sm animate-slide-down",
          verificationStatus === 'APPROVED' ? "bg-green-50 border-green-100" :
          verificationStatus === 'PENDING' ? "bg-blue-50 border-blue-100" :
          verificationStatus === 'REJECTED' ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
        )}>
           <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                verificationStatus === 'APPROVED' ? "bg-green-100 text-green-600" :
                verificationStatus === 'PENDING' ? "bg-blue-100 text-blue-600" :
                verificationStatus === 'REJECTED' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              )}>
                 {verificationStatus === 'APPROVED' ? <ShieldCheck size={20} /> :
                  verificationStatus === 'PENDING' ? <ClockIcon size={20} /> :
                  verificationStatus === 'REJECTED' ? <AlertCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                 <p className={cn(
                   "font-bold text-sm",
                   verificationStatus === 'APPROVED' ? "text-green-900" :
                   verificationStatus === 'PENDING' ? "text-blue-900" :
                   verificationStatus === 'REJECTED' ? "text-red-900" : "text-amber-900"
                 )}>
                   {verificationStatus === 'APPROVED' ? "Profil vérifié" :
                    verificationStatus === 'PENDING' ? "Vérification en cours" :
                    verificationStatus === 'REJECTED' ? "Vérification rejetée" : "Profil non vérifié"}
                 </p>
                 <p className={cn(
                   "text-xs mt-0.5",
                   verificationStatus === 'APPROVED' ? "text-green-700" :
                   verificationStatus === 'PENDING' ? "text-blue-700" :
                   verificationStatus === 'REJECTED' ? "text-red-700" : "text-amber-700"
                 )}>
                   {verificationStatus === 'APPROVED' ? "Votre profil est visible par tous les clients." :
                    verificationStatus === 'PENDING' ? "Votre demande est en cours d'examen par l'administrateur." :
                    verificationStatus === 'REJECTED' ? "Votre demande a été refusée. Veuillez corriger vos informations." : 
                    "Demandez la vérification pour rendre vos services visibles."}
                 </p>
              </div>
           </div>
           {(verificationStatus === 'NONE' || verificationStatus === 'REJECTED') && (
             <Button size="sm" onClick={handleRequestVerification}>Demander</Button>
           )}
        </div>
      )}

      {/* Profile preview */}
      <div className="card p-5 flex items-center gap-4">
        <Avatar name={`${firstName} ${lastName}`.trim() || 'Utilisateur'} size="xl" />
        <div>
          <p className="font-semibold text-text text-lg">
            {firstName || lastName ? `${firstName} ${lastName}` : 'Nouveau Profil'}
          </p>
          <p className="text-sm text-primary font-medium">{user?.email}</p>
          <div className="flex gap-2 mt-1">
             <span className="text-[10px] bg-soft px-2 py-0.5 rounded-full text-muted uppercase font-bold tracking-wider">
               {user?.role === 'CLIENT' ? 'Patient' : user?.role === 'SPECIALIST' ? 'Spécialiste' : 'Admin'}
             </span>
             {!profileExists && (
               <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded-full text-amber-700 uppercase font-bold tracking-wider">
                 À créer
               </span>
             )}
          </div>
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
              <Input label="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Ex: Jean" />
              <Input label="Nom"    value={lastName}  onChange={e => setLastName(e.target.value)}  required placeholder="Ex: Martin" />
            </div>
            <Input label="Téléphone" value={phone} onChange={e => setPhone(e.target.value)}
              icon={<Phone size={15} />} placeholder="+33 6 00 00 00 00" />
            {hasRole('SPECIALIST') && (
              <>
                <Input label="Nom affiché (Public)" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ex: Dr. Jean Martin" />
                <Input label="Titre professionnel" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Cardiologue, Médecin généraliste…" />
                <div>
                  <label className="text-sm font-medium text-text block mb-1.5">Biographie</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    className="input-base resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Décrivez votre expérience, vos spécialités…"
                  />
                </div>
              </>
            )}
          </>
        )}

        {tab === 'address' && (
          <>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text">Localisation géographique</label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <MapPin size={12} /> Ma position actuelle
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitude" value={latitude?.toString() ?? ''} disabled placeholder="Auto-détecté" />
              <Input label="Longitude" value={longitude?.toString() ?? ''} disabled placeholder="Auto-détecté" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input label="Pays"   value={country} onChange={e => setCountry(e.target.value)} required placeholder="Ex: France" />
              <Input label="Région" value={region}  onChange={e => setRegion(e.target.value)} placeholder="Ex: Île-de-France" />
            </div>
            <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} required placeholder="Ex: Paris" />
            <Input label="Adresse complète" value={line} onChange={e => setLine(e.target.value)}
              placeholder="Ex: 12 rue de la Paix" icon={<MapPin size={15} />} />
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
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button type="submit" loading={loading} icon={<Save size={15} />} fullWidth={!profileExists}>
              {profileExists ? 'Enregistrer les modifications' : 'Créer mon profil'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
