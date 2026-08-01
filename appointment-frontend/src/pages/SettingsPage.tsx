import { useState, useEffect, FormEvent } from 'react'
import { User, MapPin, Phone, Save, Briefcase, AlertCircle, ShieldCheck, Clock as ClockIcon, Camera, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { clientApi, providerApi, uploadApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui'
import { cn } from '@/utils'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type Tab = 'profile' | 'address' | 'security'

export function SettingsPage() {
  const { user, hasRole, setProfileCompleted } = useAuthStore()
  const [tab, setTab]         = useState<Tab>('profile')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [bio,       setBio]       = useState('')
  const [title,     setTitle]     = useState('')
  const [category,  setCategory]  = useState('')
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

  // Photo fields
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined)
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(undefined)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | undefined>(undefined)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | undefined>(undefined)

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
          setProfilePhoto(c.profilePhoto)
          setCountry(c.address?.country ?? '')
          setCity(c.address?.city ?? '')
          setRegion(c.address?.region ?? '')
          setLine(c.address?.addressLine ?? '')
          setLatitude(c.address?.latitude ?? null)
          setLongitude(c.address?.longitude ?? null)
        } else if (hasRole('PROVIDER')) {
          const exists = await providerApi.existsProfile()
          if (!exists) {
            setProfileExists(false)
            return
          }

          const s = await providerApi.getMe()
          setProfileExists(true)
          setVerificationStatus(s.verificationStatus)
          setFirstName(s.firstName)
          setLastName(s.lastName)
          setPhone(s.phone ?? '')
          setBio(s.bio ?? '')
          setTitle(s.profileTitle ?? '')
          setCategory(s.category ?? '')
          setDisplayName(s.displayName ?? '')
          setProfilePhoto(s.profilePhoto)
          setCoverPhoto(s.coverPhoto)
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
      await providerApi.requestVerification()
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

      const folder = hasRole('PROVIDER') ? 'providers' : 'clients'
      let finalProfilePhoto = profilePhoto
      if (profilePhotoFile) {
        finalProfilePhoto = await uploadApi.uploadImage(profilePhotoFile, folder)
      }
      let finalCoverPhoto = coverPhoto
      if (coverPhotoFile) {
        finalCoverPhoto = await uploadApi.uploadImage(coverPhotoFile, 'providers')
      }
      
      if (hasRole('CLIENT')) {
        const data = { firstName, lastName, phone, profilePhoto: finalProfilePhoto, address }
        profileExists ? await clientApi.updateProfile(data) : await clientApi.createProfile(data)
      } else {
        const data = {
          firstName, lastName, phone, bio, profileTitle: title, category,
          displayName,
          profilePhoto: finalProfilePhoto,
          coverPhoto: finalCoverPhoto,
          serviceAddress: address,
        }
        profileExists ? await providerApi.updateProfile(data) : await providerApi.createProfile(data)
      }
      
      setProfileExists(true)
      setProfileCompleted(true)
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

      {hasRole('PROVIDER') && profileExists && (
        <div className={cn(
          "rounded-2xl p-4 flex items-center justify-between gap-4 border shadow-sm animate-slide-down",
          verificationStatus === 'APPROVED' ? "bg-accent/10 border-accent/20" :
          verificationStatus === 'PENDING' ? "bg-primary/10 border-primary/20" :
          verificationStatus === 'REJECTED' ? "bg-accent/10 border-accent/20" : "bg-accent/10 border-accent/20"
        )}>
           <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                verificationStatus === 'APPROVED' ? "bg-accent/15 text-accent" :
                verificationStatus === 'PENDING' ? "bg-primary/15 text-primary" :
                verificationStatus === 'REJECTED' ? "bg-accent/15 text-accent" : "bg-accent/15 text-accent"
              )}>
                 {verificationStatus === 'APPROVED' ? <ShieldCheck size={20} /> :
                  verificationStatus === 'PENDING' ? <ClockIcon size={20} /> :
                  verificationStatus === 'REJECTED' ? <AlertCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                 <p className={cn(
                   "font-bold text-sm",
                   verificationStatus === 'APPROVED' ? "text-accent" :
                   verificationStatus === 'PENDING' ? "text-primary" :
                   verificationStatus === 'REJECTED' ? "text-accent" : "text-accent"
                 )}>
                   {verificationStatus === 'APPROVED' ? "Profil vérifié" :
                    verificationStatus === 'PENDING' ? "Vérification en cours" :
                    verificationStatus === 'REJECTED' ? "Vérification rejetée" : "Profil non vérifié"}
                 </p>
                 <p className={cn(
                   "text-xs mt-0.5",
                   verificationStatus === 'APPROVED' ? "text-accent" :
                   verificationStatus === 'PENDING' ? "text-primary" :
                   verificationStatus === 'REJECTED' ? "text-accent" : "text-accent"
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
        <Avatar name={`${firstName} ${lastName}`.trim() || 'Utilisateur'} src={profilePhotoPreview || profilePhoto} size="xl" />
        <div>
          <p className="font-semibold text-text text-lg">
            {firstName || lastName ? `${firstName} ${lastName}` : 'Nouveau Profil'}
          </p>
          <p className="text-sm text-primary font-medium">{user?.email}</p>
          <div className="flex gap-2 mt-1">
             <span className="text-[10px] bg-soft px-2 py-0.5 rounded-full text-muted uppercase font-bold tracking-wider">
               {user?.role === 'CLIENT' ? 'Client' : user?.role === 'PROVIDER' ? 'Prestataire' : 'Admin'}
             </span>
             {!profileExists && (
               <span className="text-[10px] bg-accent/15 px-2 py-0.5 rounded-full text-accent uppercase font-bold tracking-wider">
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
            {/* Photo de profil */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <Avatar
                  name={`${firstName} ${lastName}`.trim() || 'Utilisateur'}
                  src={profilePhotoPreview || profilePhoto}
                  size="xl"
                />
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setProfilePhotoFile(file)
                      setProfilePhotoPreview(await readFileAsDataUrl(file))
                    }}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text text-sm">Photo de profil</p>
                <p className="text-xs text-muted mt-0.5">JPG, PNG, WebP — 5 Mo max</p>
                {(profilePhotoFile || profilePhoto) && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePhotoFile(null)
                      setProfilePhotoPreview(undefined)
                      setProfilePhoto('')
                    }}
                    className="text-xs text-muted hover:text-primary transition-colors mt-1"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
            </div>

            {hasRole('PROVIDER') && (
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Photo de couverture</label>
                <label className="flex items-center justify-center gap-2 w-full cursor-pointer border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-xl px-4 py-3 text-sm text-muted hover:text-text transition-colors">
                  <ImagePlus size={15} />
                  {coverPhotoFile ? coverPhotoFile.name : 'Choisir une image de couverture'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setCoverPhotoFile(file)
                      setCoverPhotoPreview(await readFileAsDataUrl(file))
                    }}
                  />
                </label>
                {(coverPhotoFile || coverPhoto) && (
                  <div className="mt-3">
                    <div className="h-24 rounded-xl overflow-hidden border border-border">
                      <img
                        src={coverPhotoPreview || coverPhoto}
                        alt="Aperçu couverture"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPhotoFile(null)
                        setCoverPhotoPreview(undefined)
                        setCoverPhoto('')
                      }}
                      className="text-xs text-muted hover:text-primary transition-colors mt-2"
                    >
                      Retirer la photo
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Ex: Jean" />
              <Input label="Nom"    value={lastName}  onChange={e => setLastName(e.target.value)}  required placeholder="Ex: Martin" />
            </div>
            <Input label="Téléphone" value={phone} onChange={e => setPhone(e.target.value)}
              icon={<Phone size={15} />} placeholder="+33 6 00 00 00 00" />
            {hasRole('PROVIDER') && (
              <>
                <Input label="Nom affiché (Public)" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ex: Jean Martin" />
                <Input label="Titre professionnel" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Coiffeur, Esthéticienne, Réparateur…" />
                <Input label="Catégorie" value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="Ex: Coiffure, Esthétique, Réparation…" />
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
