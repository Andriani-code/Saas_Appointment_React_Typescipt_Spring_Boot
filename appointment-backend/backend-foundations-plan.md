# Backend Foundations – Plan détaillé

## Objectifs
1. Ajouter les endpoints manquants pour les entités **Address** et **VerificationRequest**.
2. Créer les repositories correspondants.
3. Implémenter les DTO de requête/réponse.
4. Ajouter les contrôles d’accès (`@PreAuthorize`).
5. Mettre à jour la configuration de sécurité si nécessaire.

## Étapes
### 1️⃣ Créer l’API Address
- **DTOs**
  - `AddressRequest` (street, city, zip, country, userId)
  - `AddressResponse` (idem + id)
- **Repository**
```java
public interface AddressRepository extends JpaRepository<Address, String> {
    List<Address> findByUserId(String userId);
}
```
- **Service** (`AddressService`) avec méthodes CRUD, validation et conversion DTO↔entity.
- **Controller** `AddressController`
```java
@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Tag(name="Addresses", description="Gestion des adresses utilisateur")
public class AddressController {
    private final AddressService addressService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<AddressResponse> create(@Valid @RequestBody AddressRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.create(req));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<AddressResponse>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(addressService.getByUser(userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<AddressResponse> update(@PathVariable String id, @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(addressService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        addressService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 2️⃣ Créer l’API VerificationRequest
- **DTOs**
  - `VerificationRequestResponse` (id, specialistId, status, createdAt)
- **Repository**
```java
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, String> {
    Optional<VerificationRequest> findBySpecialistId(String specialistId);
}
```
- **Service** (`VerificationRequestService`) avec méthodes `requestVerification`, `approve`, `reject`.
- **Controller** `VerificationRequestController`
```java
@RestController
@RequestMapping("/api/v1/verifications")
@RequiredArgsConstructor
@Tag(name="Verification", description="Gestion des demandes de vérification de spécialistes")
public class VerificationRequestController {
    private final VerificationRequestService service;

    @PostMapping("/specialist/{specialistId}")
    @PreAuthorize("hasRole('SPECIALIST')")
    public ResponseEntity<VerificationRequestResponse> request(@PathVariable String specialistId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.requestVerification(specialistId));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VerificationRequestResponse> approve(@PathVariable String id) {
        return ResponseEntity.ok(service.approve(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VerificationRequestResponse> reject(@PathVariable String id) {
        return ResponseEntity.ok(service.reject(id));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VerificationRequestResponse>> pending() {
        return ResponseEntity.ok(service.getPending());
    }
}
```

### 3️⃣ Sécurité & Validation
- Ajouter `@Valid` sur les corps de requête.
- Mettre à jour `SecurityConfig` pour autoriser les nouvelles URL dans les `antMatchers`.
- Vérifier que les rôles `USER`, `ADMIN`, `SPECIALIST` existent dans l’enum `Role`.

### 4️⃣ Tests
- Tests unitaires pour `AddressService` et `VerificationRequestService`.
- Tests d’intégration (`@SpringBootTest`) pour les nouveaux contrôleurs : vérification des réponses 200/201, 403 (absence de rôle), 400 (validation).

## Emplacement du fichier
Le plan est sauvegardé à **`appointment-backend/backend-foundations-plan.md`**.
