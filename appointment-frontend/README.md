# BookDoc — Frontend

Interface utilisateur pour la plateforme de réservation de rendez-vous BookDoc.
Construite avec **Vite + React + TypeScript + Tailwind CSS**.

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Style | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| HTTP | Axios (avec intercepteurs JWT) |
| Icônes | Lucide React |
| Fonts | Sora (corps) + Playfair Display (titres) |

---

## Structure du projet

```
src/
├── components/
│   ├── ui/           # Button, Input, Card, Badge, Avatar, Spinner…
│   ├── dashboard/    # StatCard
│   ├── specialist/   # SpecialistCard
│   └── appointment/  # AppointmentCard
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── SpecialistsPage.tsx
│   ├── SpecialistDetail.tsx
│   ├── AppointmentsPage.tsx
│   ├── MessagesPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
├── layouts/
│   └── MainLayout.tsx       # Sidebar avec navigation rôle-based
├── hooks/
│   └── useAuth.tsx          # AuthContext + useAuth()
├── services/
│   ├── apiClient.ts         # Axios + intercepteurs JWT auto-refresh
│   └── api.ts               # Toutes les fonctions API
├── types/
│   └── index.ts             # Types TypeScript alignés avec le backend
└── utils/
    └── index.ts             # cn(), formatDate, formatCurrency…
```

---

## Palette de couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| `primary` | `#C4781B` | Boutons, liens actifs, éléments principaux |
| `background` | `#F2F1F1` | Fond de page |
| `surface` | `#FFFFFF` | Cartes, panels |
| `soft` | `#F1F1F1` | Fonds secondaires, inputs |
| `text` | `#090A0F` | Texte principal |
| `muted` | `#555555` | Texte secondaire |

---

## Installation & démarrage

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation

```bash
cd appointment-frontend
npm install
```

### Développement

```bash
npm run dev
```

L'application tourne sur **http://localhost:5173**

> Le proxy Vite redirige `/api` vers `http://localhost:8080` (backend Spring Boot).
> Assurez-vous que le backend tourne avant de démarrer le frontend.

### Build production

```bash
npm run build
npm run preview
```

---

## Pages disponibles

| Route | Page | Accès |
|-------|------|-------|
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/dashboard` | Tableau de bord | Tous |
| `/specialists` | Trouver un spécialiste | CLIENT |
| `/specialists/:id` | Profil + réservation | CLIENT |
| `/appointments` | Mes rendez-vous | Tous |
| `/messages` | Messagerie | Tous |
| `/settings` | Paramètres profil | Tous |

---

## Connexion au backend

Le fichier `src/services/apiClient.ts` gère :
- **Injection automatique** du Bearer token dans chaque requête
- **Refresh automatique** du token si 401 reçu
- **Redirection vers /login** si refresh échoue

Toutes les fonctions API sont dans `src/services/api.ts`, organisées par domaine :
`authApi`, `clientApi`, `specialistApi`, `serviceApi`, `slotApi`,
`reservationApi`, `paymentApi`, `reviewApi`, `messagingApi`

---

## Fonctionnalités par rôle

### CLIENT
- Inscription / connexion
- Recherche de spécialistes (avec géolocalisation)
- Consultation du profil spécialiste + avis
- Réservation de créneaux
- Suivi de ses rendez-vous (annulation)
- Messagerie avec spécialistes
- Mise à jour du profil

### SPECIALIST
- Inscription / connexion
- Tableau de bord avec statistiques
- Gestion des rendez-vous (confirmer, rejeter, terminer, absent)
- Messagerie avec patients
- Mise à jour du profil + biographie

### ADMIN
- Accès à toutes les fonctionnalités
- Navigation vers section administration

---

## Variables d'environnement

Créez un `.env.local` si vous souhaitez changer l'URL du backend :

```env
VITE_API_BASE_URL=http://localhost:8080
```

*(Le proxy Vite suffit en développement)*
