# Architecture de l'application BookDoc

Ce document décrit l'**architecture complète** de la plateforme de réservation de rendez-vous **BookDoc** : monorepo, stack technique, structure des packages frontend et backend, état, sécurité et déploiement. La seconde partie détaille le **flux complet d'une requête** (du clic à la base de données) via un exemple CRUD.

---

## 1. Vue d'ensemble

```
                        ┌─────────────────────────────────────┐
                        │        appointment-frontend          │
                        │      React 18 + Vite + TypeScript    │
                        │  Tailwind CSS 4 · Zustand · Axios    │
                        └──────────────────┬──────────────────┘
                                           │ HTTP (Axios, JWT Bearer)
                                           │ /api/* · /uploads · /ws
                        ┌──────────────────▼──────────────────┐
                        │    Proxy Vite (dev) / Nginx (prod)   │
                        └──────────────────┬──────────────────┘
                                           ▼
                        ┌─────────────────────────────────────┐
                        │        appointment-backend           │
                        │      Spring Boot 3.2 · Java 21       │
                        │  Spring Security · JWT · JPA · Mail  │
                        └──────────────────┬──────────────────┘
                                           ▼
                       ┌───────────────────────────────────────┐
                       │            PostgreSQL (Flyway)         │
                       └───────────────────────────────────────┘
```

Trois conteneurs Docker (`docker-compose.yml`) : `postgres` (PostgreSQL 18), `backend` (Spring Boot, port 8080) et `frontend` (nginx, port 5173 → 80).

---

## 2. Stack technique

### Backend — `appointment-backend/` (Maven)

| Technologie | Rôle |
| ----------- | ---- |
| Spring Boot 3.2.5 | Framework applicatif |
| Java 21 | Langage |
| Spring Web | Contrôleurs REST |
| Spring Security + JWT (jjwt 0.12) | Authentification par token |
| Spring Data JPA / Hibernate | Persistance ORM |
| PostgreSQL | Base de données |
| Flyway 10 | Migrations SQL (`db/migration`) |
| MapStruct 1.5 + Lombok | Conversion DTO ↔ entité |
| Spring Mail | Emails (SMTP Gmail) |
| Stripe Java 25 | Paiements (dépôts) |
| WebSocket + SockJS/STOMP | Messagerie temps réel |
| springdoc-openapi | Swagger UI (`/swagger-ui.html`) |
| AWS SDK S3 | Stockage d'images (optionnel) |

### Frontend — `appointment-frontend/` (npm)

| Technologie | Rôle |
| ----------- | ---- |
| React 18 + TypeScript | UI |
| Vite 5 | Bundler / serveur de dev (proxy `/api` → :8080) |
| Tailwind CSS 4 | Styles (via `@tailwindcss/vite`) |
| Zustand 4 | État global (2 stores) |
| React Router 6 | Navigation |
| Axios | Client HTTP (intercepteurs JWT + refresh) |
| react-hot-toast | Notifications |
| lucide-react | Icônes |
| framer-motion | Animations |
| @stomp/stompjs + sockjs-client | Messagerie WebSocket |
| Vitest + Testing Library | Tests unitaires front |

---

## 3. Structure du monorepo

```
D:\SPRING-APPOINTMENT
├── appointment-backend/          # Spring Boot (Maven)
│   ├── src/main/java/com/app/
│   │   ├── config/               # Security, JWT, Stripe, WebSocket, CORS, DataSeeder
│   │   ├── controller/           # Endpoints REST (par entité)
│   │   ├── dto/                  # request/ + response/ (couche HTTP)
│   │   ├── entity/               # Entités JPA (User, Client, Provider, Reservation…)
│   │   ├── exception/            # Exceptions + GlobalExceptionHandler
│   │   ├── mapper/               # MapStruct (DTO ↔ entité)
│   │   ├── repository/           # Spring Data JPA
│   │   ├── security/             # JWT filter, service, entry point
│   │   ├── service/ + service/impl/
│   │   └── util/                 # SecurityUtils (utilisateur courant)
│   └── src/main/resources/
│       ├── application.yml       # Config (DB, JWT, Stripe, mail, CORS…)
│       └── db/migration/         # Scripts SQL Flyway
├── appointment-frontend/         # React + Vite
│   └── src/
│       ├── app/                  # Providers racine
│       ├── components/           # UI (Button, Card, Modal…) + métier (appointment, provider…)
│       ├── hooks/                # usePaginatedFetch
│       ├── layouts/              # MainLayout (sidebar, header)
│       ├── pages/                # Une page par route
│       ├── routes/               # AppRoutes, PrivateRoute, RoleRoute
│       ├── services/             # apiClient.ts (Axios) + api.ts (endpoints) + authStorage
│       ├── store/                # authStore.ts, bookingStore.ts (Zustand)
│       ├── types/                # Tous les types TS
│       └── utils/                # Helpers (format, cn…)
├── docker-compose.yml            # postgres + backend + frontend
├── .env / .env.example           # Variables d'environnement
└── tuto.md
```

---

## 4. Backend — architecture en couches

Chaque module suit le même schéma strict : **Controller → Service (interface + impl) → Mapper → Repository → base**.

```
HTTP (JSON + JWT)
   │
   ▼
SecurityConfig (endpoints publics vs protégés)
   │  JwtAuthenticationFilter → lit le token → SecurityContext
   ▼
Controller (@RestController, @PreAuthorize, validation @Valid)
   │
   ▼
Service (interface)  ── impl ──>  logique métier + @Transactional
   │
   ▼
Mapper (MapStruct)  DTO request/response ↔ Entité
   │
   ▼
Repository (JPA, méthodes dérivées / @Query)
   │
   ▼
PostgreSQL (schéma géré par Flyway, `ddl-auto: validate`)
```

### Points clés

- **Entités** : `User` (compte, rôle, authProvider), `Client`, `Provider`, `ProviderService`, `Availability`, `AvailableSlot`, `Reservation`, `Payment`, `Review`, `Conversation`, `Message`, `Favorite`, `VerificationRequest`, `Address`.
- **Rôles** : `ADMIN`, `CLIENT`, `PROVIDER` (`Role` enum). `@PreAuthorize("hasRole('X')")` protège les endpoints d'écriture ; les lectures publiques restent ouvertes.
- **Utilisateur courant** : `SecurityUtils.getCurrentUserEmail()` → service charge l'entité correspondante. C'est le mécanisme de **ownership** (un client ne peut noter que ses propres réservations, un prestataire ne modifie que ses services).
- **DTO ≠ Entité** : jamais d'entité exposée en HTTP ; les mappers MapStruct convertissent (`toResponse` / `toEntity` / `updateEntityFromRequest`).
- **Exceptions** : `ResourceNotFoundException`, `BadRequestException`, `UnauthorizedException` → `GlobalExceptionHandler` renvoie un `ErrorResponse` JSON avec le bon code HTTP.
- **Transactions** : chaque opération d'écriture est `@Transactional` (rollback automatique en cas d'échec).

---

## 5. Frontend — architecture

### Routing (React Router) — `routes/AppRoutes.tsx`

```
Public :  /login · /register · /
Privé (MainLayout + JWT) : /dashboard · /profile · /settings
         · /appointments · /messages · /payments · /reviews
CLIENT  : /providers · /providers/:id        (RoleRoute)
PROVIDER: /services · /clients · /availability (RoleRoute)
ADMIN   : /admin                             (RoleRoute)
```

- `PrivateRoute` : redirige vers `/login` si non authentifié.
- `RoleRoute` : filtre par rôle (`allowedRoles`), chaque page est chargée en **lazy loading** via `React.lazy` + `Suspense`.

### État global (Zustand)

- `store/authStore.ts` — session (user, `isAuthenticated`, `login`, `logout`, `hasRole`), persistée dans localStorage via `services/authStorage.ts`.
- `store/bookingStore.ts` — état du parcours de réservation : `selectedProvider`, `selectedDate`, `selectedSlot` (partagé entre ProvidersPage et ProviderDetail).

### Client HTTP — `services/apiClient.ts`

- Instance Axios avec `baseURL: '/api/v1'`.
- **Intercepteur requête** : injecte `Authorization: Bearer <accessToken>`.
- **Intercepteur réponse** :
  - `401` → refresh du token **une seule fois** (anti-emballement `refreshInFlight`), puis rejoue la requête ; si le refresh échoue → déconnexion + redirection `/login`.
  - Toast seulement pour les erreurs réseau (aucune réponse) et les `5xx` ; les `4xx` sont gérées par les pages (option `silent` pour masquer).
- `services/api.ts` regroupe les API par domaine : `authApi`, `clientApi`, `providerApi`, `serviceApi`, `availabilityApi`, `slotApi`, `reservationApi`, `paymentApi`, `reviewApi`, `favoriteApi`, `messagingApi`, `uploadApi`.

### UI

- Composants de base réutilisables dans `components/ui/` : `Button`, `Card`, `Input`, `Modal`, `Badge`, `Avatar`, `Spinner`, `EmptyState`, `StarRating`, `Tabs`, `Select`, `Textarea`, `Toast`, `ErrorBoundary`.
- Composants métier : `components/appointment/AppointmentCard`, `components/provider/ProviderCard` + `ServiceCard`, `components/dashboard/StatCard`.
- Une page par écran dans `pages/` (`LandingPage`, `DashboardPage`, `ProvidersPage`, `ProviderDetail`, `AppointmentsPage`, `ReviewsPage`, `MessagesPage`, `PaymentsPage`, `AdminPage`…).

---

## 6. Flux des données (exemple CRUD : gestion des services)

Le schéma de la section précédente s'illustre concrètement par le flux ci-dessous.

```
Browser (React)
   │  HTTP (Axios, JWT)
   ▼
Vite proxy (/api → localhost:8080)
   │
   ▼
Spring Security (JwtAuthenticationFilter)
   │
   ▼
Controller  →  Service  →  Mapper  →  Repository (JPA/Hibernate)  →  PostgreSQL
   │                                              ▲
   └──────────────  réponse JSON  ◄───────────────┘
```

### Étape 1 — Le formulaire React (`ServicesPage.tsx`)

L'état du formulaire est stocké dans des `useState` (`name`, `price`, `durationMinutes`, etc.). À la soumission, `handleSubmit` construit un objet `ProviderServiceRequest` et appelle la bonne fonction API :

```tsx
if (editingService) {
  await serviceApi.update(editingService.id, data); // PUT
} else {
  await serviceApi.create(data);                    // POST
}
```

### Étape 2 — Le client Axios (`services/api.ts` + `apiClient.ts`)

- `serviceApi.create(data)` appelle `apiClient.post("/services", data)`.
- L'URL de base est `/api/v1` (voir `apiClient.ts:17`).
- **Intercepteur de requête** : avant chaque appel, `apiClient` ajoute le header `Authorization: Bearer <accessToken>` si un token existe (`apiClient.ts:30-38`).
- **Intercepteur de réponse** : si le serveur répond `401`, le client tente un refresh du token (single-flight), sinon il affiche l'erreur via un toast (`apiClient.ts:83-132`).

### Étape 3 — Le proxy Vite (`vite.config.ts`)

En développement, le navigateur appelle `http://localhost:5173/api/...`. Vite fait suivre automatiquement :

```ts
proxy: {
  '/api':     { target: 'http://localhost:8080', changeOrigin: true },
  '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
  '/ws':      { target: 'http://localhost:8080', changeOrigin: true, ws: true },
}
```

En production, c'est `nginx.conf` qui joue ce rôle de reverse proxy.

### Étape 4 — Authentification JWT (`JwtAuthenticationFilter`)

À l'arrivée sur le backend, le filtre Spring Security lit le header `Authorization` :

- si le token est valide, il charge l'utilisateur (`CustomUserDetailsService`) et place son `Authentication` dans le `SecurityContextHolder` ;
- le contrôleur peut alors connaître l'utilisateur courant via `SecurityUtils.getCurrentUserEmail()`.

### Étape 5 — Le contrôleur (`ServiceController`)

Le `@RestController` mappe la route HTTP vers le service métier. Il protège l'endpoint avec `@PreAuthorize` :

```java
@PostMapping
@PreAuthorize("hasRole('PROVIDER')")                       // seul un prestataire peut créer
public ResponseEntity<ProviderServiceResponse> create(
        @Valid @RequestBody ProviderServiceRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(offeringService.create(request));
}
```

La validation (annotations `@Valid` + `@NotBlank`, etc.) s'applique ici.

### Étape 6 — Le service métier (`ProviderOfferingServiceImpl`)

La logique : validation, récupération du prestataire authentifié, conversion DTO → entité, sauvegarde, puis conversion entité → DTO de réponse.

```java
@Transactional
public ProviderServiceResponse create(ProviderServiceRequest request) {
    validateServiceRequest(request);                          // ex: prix > 0
    Provider provider = getAuthenticatedProvider();           // via SecurityUtils
    ProviderService service = serviceMapper.toEntity(request);
    service.setProvider(provider);
    return serviceMapper.toResponse(serviceRepository.save(service));
}
```

Note : `@Transactional` garantit qu'une opération qui échoue au milieu est **rollbackée**.

### Étape 7 — Le mapper MapStruct (`ProviderServiceMapper`)

Il fait le pont entre le monde HTTP (DTO) et le monde persistant (entité) :

- `toEntity(request)` : `ProviderServiceRequest` → entité `ProviderService` (les champs `id`, `provider`, `isActive`, `createdAt`… sont ignorés, donc gérés par JPA) ;
- `toResponse(service)` : entité → `ProviderServiceResponse` (avec `id` converti en `String`) ;
- `updateEntityFromRequest(request, service)` : met à jour une entité existante sans écraser les champs ignorés (utilisé pour l'**Update**).

### Étape 8 — Le repository (Spring Data JPA) et PostgreSQL

`ProviderServiceRepository` hérite de `JpaRepository<ProviderService, UUID>`. La méthode `save()` déclenche une requête SQL (`INSERT` / `UPDATE` / `SELECT`) générée par Hibernate.

```java
serviceRepository.save(service); // → INSERT INTO provider_services ...
```

### Étape 9 — La réponse, en sens inverse

La réponse remonte le même chemin en sens inverse :

```
entité → ProviderServiceResponse (Mapper) → HTTP 201 (Controller)
      → JSON → Vite proxy → Axios → loadData() dans ServicesPage → re-render React
```

Le frontend rafraîchit ensuite la liste (`loadData()`), donc l'utilisateur voit immédiatement son nouveau service.

---

## 7. Le CRUD complet, récapitulé

| Opération | Frontend (`api.ts`) | HTTP | Backend (Controller) | Service |
| --------- | ------------------- | ---- | -------------------- | ------- |
| **C**reate | `serviceApi.create` | `POST /services` | `ServiceController.create` | `create()` |
| **R**ead | `getActiveByProvider` / `getById` | `GET /services/provider/{id}` / `GET /services/{id}` | `getActiveByProvider` / `getById` | `getActiveByProvider()` / `getById()` |
| **U**pdate | `serviceApi.update` | `PUT /services/{id}` | `ServiceController.update` | `update()` |
| **D**elete | `serviceApi.deactivate` | `DELETE /services/{id}` | `ServiceController.deactivate` | `deactivate()` |

Points d'attention sur ce CRUD :

- **Delete est un soft delete** : `deactivate()` passe simplement `isActive = false`, la ligne reste en base.
- **Update** : le service ne modifie une offre que si elle appartient au prestataire connecté (`findByIdAndProviderId`), ce qui empêche un prestataire de modifier le service d'un autre.
- **Ownership** : les opérations sensibles (`create`, `update`, `deactivate`) vérifient le rôle via `@PreAuthorize` **et** l'appartenance dans le service.

---

## 8. Sécurité et exceptions en travers du flux

- **Sécurité** : `@PreAuthorize("hasRole('PROVIDER')")` protège les endpoints d'écriture ; les lectures publiques (`GET /services/{id}`) restent ouvertes. Le rôle est aussi vérifié côté frontend via `RoleRoute`.
- **JWT** : deux tokens — access (15 min) et refresh (7 jours) — générés par `JwtService`, renouvelés automatiquement par l'intercepteur Axios.
- **Erreurs** : si un service est introuvable, le `ResourceNotFoundException` est levé dans le service et attrapé par `GlobalExceptionHandler`, qui renvoie un JSON `ErrorResponse` avec le bon code HTTP (404, 400, etc.). Côté frontend, l'intercepteur Axios affiche `message` dans un toast.

---

## 9. Messagerie temps réel (WebSocket + STOMP)

La messagerie client ↔ prestataire (`/messages`) fonctionne en **REST pour la persistance** et en **WebSocket + STOMP pour le temps réel** : un message envoyé apparaît immédiatement sur l'écran de l'autre participant sans recharger la page.

### 9.1 Vue d'ensemble

```
Browser (MessagesPage — @stomp/stompjs + SockJS)
   │  WebSocket STOMP sur /ws (SockJS)
   ▼
WebSocketConfig  (endpoint /ws, SockJS)
   │  JwtChannelInterceptor  → authentifie le frame STOMP CONNECT (JWT)
   │  WebSocketSecurityConfig → CONNECT/HEARTBEAT/... permitAll,
   │                             SUBSCRIBE/SEND → authenticated
   ▼
MessageController @MessageMapping("/chat/{conversationId}")
   ▼
MessagingServiceImpl.sendMessage()
   │  sauvegarde en base (MessageRepository)
   ├──→ /topic/conversations/{id}        (broadcast à la conversation)
   ├──→ /user/{email}/queue/messages     (destinataire, temps réel)
   └──→ /user/{email}/queue/messages     (expéditeur, autres onglets)
```

### 9.2 Destinations STOMP

| Destination | Sens | Rôle |
| ----------- | ---- | ---- |
| `/ws` (SockJS) | connexion | Endpoint WebSocket |
| `/app/chat/{conversationId}` | envoi | Envoi d'un message (frame `SEND`) |
| `/topic/conversations/{conversationId}` | réception | Broadcast : tout client abonné à la conversation |
| `/user/{email}/queue/messages` | réception | File personnelle : message reçu par le destinataire (et l'expéditeur) |

### 9.3 Configuration backend (`WebSocketConfig`)

```java
registry.enableSimpleBroker("/topic", "/queue");      // broker simple en mémoire
registry.setApplicationDestinationPrefixes("/app");    // destinations d'entrée (@MessageMapping)
registry.setUserDestinationPrefix("/user");            // résolution /user/{email} → session

registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
```

- `/topic/*` : destinations publiques (broadcast à tous les abonnés).
- `/queue/*` : destinations privées, résolues par utilisateur via le préfixe `/user`.
- `/app/*` : préfixe que le client utilise pour envoyer (`@MessageMapping`).

### 9.4 Sécurité WebSocket

Le handshake HTTP `/ws` est déclaré **public** dans `SecurityConfig` (aucun header JWT ne passe par le handshake HTTP d'un WebSocket). L'authentification STOMP se fait au niveau du frame `CONNECT` :

- **`JwtChannelInterceptor`** (intercepteur du canal entrant, ordre `HIGHEST_PRECEDENCE`) : lit le JWT dans le header `Authorization: Bearer …` (ou `token`) du frame `CONNECT`, valide le token, charge l'utilisateur et le pose comme `Principal` sur la session. Sans lui, la session reste anonyme et `/user/*` ne peut pas être résolu → boucle de reconnexion côté frontend.
- **`WebSocketSecurityConfig`** (`@EnableWebSocketSecurity`) : les frames de contrôle (`CONNECT`, `HEARTBEAT`, `UNSUBSCRIBE`, `DISCONNECT`, …) sont `permitAll` — car le `Principal` n'est posé que *pendant* le traitement de `CONNECT` — tandis que `SUBSCRIBE` et `MESSAGE` exigent une session authentifiée. Le `SecurityContextChannelInterceptor` (activé par l'annotation) propage ensuite ce `Principal` au `SecurityContextHolder`, donc `SecurityUtils.getCurrentUserEmail()` fonctionne dans les handlers `@MessageMapping`.

### 9.5 Envoi d'un message (backend)

Le contrôleur `MessageController` expose un handler STOMP :

```java
@MessageMapping("/chat/{conversationId}")
public void handleWebSocketMessage(@DestinationVariable String conversationId, MessageRequest request) {
    messagingService.sendMessage(conversationId, request);
}
```

`MessagingServiceImpl.sendMessage()` persiste le message puis le **pousse** sur trois destinations via `SimpMessagingTemplate` :

```java
Message saved = messageRepository.save(message);
MessageResponse response = messageMapper.toResponse(saved);

// 1) Broadcast aux abonnés de la conversation
messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);

// 2) File privée du destinataire (client ou prestataire)
String recipientEmail = resolveRecipientEmail(conversation, sender);
if (recipientEmail != null) {
    messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/messages", response);
}

// 3) File privée de l'expéditeur (synchronisation des autres onglets)
messagingTemplate.convertAndSendToUser(email, "/queue/messages", response);
```

Points de contrôle avant l'envoi : l'utilisateur courant est chargé via `SecurityUtils.getCurrentUserEmail()`, la conversation doit exister, et `assertParticipant()` garantit que seul un participant (client **ou** prestataire) de la conversation peut écrire.

### 9.6 Côté frontend (`MessagesPage.tsx`)

Le client STOMP est créé avec `@stomp/stompjs` + `sockjs-client` :

```tsx
const client = new Client({
  webSocketFactory: () => new SockJS('/ws'),                    // endpoint SockJS
  connectHeaders: session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }        // JWT au CONNECT
    : {},
  reconnectDelay: 5000,                                         // reconnexion avec backoff
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
  onConnect: () => {
    setStompConnected(true);
    client.subscribe('/user/queue/messages', (payload) => {
      // message temps réel → maj de la liste des messages + conversations
    });
  },
});
```

- Dès la connexion, la page s'abonne à sa **file personnelle** `/user/queue/messages` (messages reçus en temps réel, reçus **et** envoyés — ce qui couvre le cas multi-onglets).
- Quand une conversation est active, elle s'abonne aussi au **topic** `/topic/conversations/{conversationId}` (ajout dynamique via `useEffect`, désabonnement au changement de conversation).
- Les messages reçus sont **dédupliqués par `id`** (un message arrive à la fois par le topic et par la file personnelle) avant d'être ajoutés à l'état.
- Le compteur de conversations (`unreadCount`, `lastMessageContent`, `createdAt`) est mis à jour en direct ; si la conversation n'existe pas encore, la liste est rechargée.
- La connexion est **détruite au démontage** du composant (`client.deactivate()`).

### 9.7 Repli REST et proxy

- Le même envoi existe en **REST** (`messagingApi.sendMessage` → `POST /api/v1/messages/conversations/{id}`) comme solution de repli — le backend persiste et pousse de la même façon.
- En développement, le proxy Vite relaie le WebSocket : `'/ws': { target: 'http://localhost:8080', changeOrigin: true, ws: true }`. En production, `nginx.conf` joue le même rôle.

---

## 10. À retenir

1. **Frontend → Backend** : un objet JavaScript `ProviderServiceRequest` devient un JSON dans un `POST` Axios, protégé par le token JWT ajouté par l'intercepteur.
2. **Couches backend** : `Controller` (HTTP + validation) → `Service` (logique + transactions) → `Mapper` (DTO ↔ entité) → `Repository` (SQL) → base de données.
3. **Backend → Frontend** : la base renvoie une entité, le mapper la convertit en `ProviderServiceResponse`, Spring la sérialise en JSON, et React met à jour l'état → le composant se re-render.
4. Le même schéma s'applique à **tous** les modules du projet (clients, réservations, avis, disponibilités, messages…) : seuls les DTO, services et repositories changent.
