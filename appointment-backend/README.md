# Appointment Booking Platform — Backend

A production-ready SaaS appointment booking backend built with Java 21 + Spring Boot 3.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.2 |
| Security | Spring Security + JWT (JJWT) |
| Persistence | Spring Data JPA / Hibernate |
| Database | PostgreSQL |
| Migrations | Flyway |
| Mapping | MapStruct |
| Validation | Jakarta Validation |
| API Docs | SpringDoc OpenAPI / Swagger UI |
| Payments | Stripe Java SDK |
| Messaging | Spring WebSocket (STOMP) |
| Build | Maven |

---

## Project Structure

```
com.app
├── config          # SecurityConfig, OpenApiConfig, WebSocketConfig, StripeConfig
├── security        # JwtService, JwtAuthenticationFilter, CustomUserDetailsService
├── controller      # REST controllers for all domains
├── service
│   └── impl        # Business logic implementations
├── repository      # Spring Data JPA repositories
├── entity
│   └── enums       # Domain enums
├── dto
│   ├── request     # Validated inbound DTOs
│   └── response    # Outbound response DTOs
├── mapper          # MapStruct mappers
├── exception       # GlobalExceptionHandler + custom exceptions
└── util            # SecurityUtils
```

---

## Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL 15+

---

## Setup

### 1. Create the database

```sql
CREATE DATABASE appointment_db;
```

### 2. Configure environment variables

Set these environment variables (or edit `application.yml`):

```bash
export DB_USERNAME=postgres
export DB_PASSWORD=yourpassword
export JWT_SECRET=base64-encoded-32-byte-secret
export STRIPE_SECRET_KEY=sk_test_your_stripe_key
export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Run

```bash
mvn spring-boot:run
```

Flyway will automatically apply all migrations on startup.

### JWT secret rotation

- Set a new Base64-encoded `JWT_SECRET`
- Restart the backend to apply the new signing key
- Existing access and refresh tokens become invalid after restart
- If you use a secret manager, expose it through a Spring bean implementing `com.app.security.JwtSecretProvider`

---

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

---

## Default Admin Account

Created automatically by Flyway migration V2:

| Field | Value |
|-------|-------|
| Email | admin@appointment.app |
| Password | `Admin@1234` |

> ⚠️ Change this password immediately in production.

---

## Authentication

All secured endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

### Register

```http
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "role": "CLIENT"   // CLIENT | SPECIALIST | ADMIN
}
```

### Login

```http
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Refresh Token

```http
POST /api/v1/auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

---

## Core Flows

### Specialist Onboarding
1. `POST /api/v1/auth/register` — register with role `SPECIALIST`
2. `POST /api/v1/specialists` — create profile
3. `POST /api/v1/services` — create service offerings
4. `POST /api/v1/availability` — set weekly availability
5. `POST /api/v1/slots/generate` — generate slots for a date range
6. Admin approves: `PATCH /api/v1/specialists/{id}/approve`

### Client Booking
1. `POST /api/v1/auth/register` — register with role `CLIENT`
2. `POST /api/v1/clients` — create profile
3. `GET /api/v1/specialists/nearby?lat=&lng=&radiusKm=` — discover specialists
4. `GET /api/v1/slots/specialist/{id}?date=` — view available slots
5. `POST /api/v1/reservations` — book an appointment
6. If deposit required: `POST /api/v1/payments/reservation/{id}/intent` — pay deposit

### Reservation Lifecycle
```
PENDING → CONFIRMED → COMPLETED
        → REJECTED
        → CANCELED  (client or specialist)
        → NO_SHOW
```

---

## WebSocket Messaging

Connect via STOMP at `ws://localhost:8080/ws`

| Direction | Destination |
|-----------|-------------|
| Send message | `/app/chat/{conversationId}` |
| Receive messages | `/topic/conversations/{conversationId}` |

Conversations are automatically created when a reservation is booked.

---

## Geolocation

Find nearby specialists using Haversine formula:

```http
GET /api/v1/specialists/nearby?lat=18.9101&lng=47.5362&radiusKm=25
```

Results are sorted by distance ascending.

---

## Stripe Webhooks

Configure your Stripe webhook to point to:

```
POST /api/v1/payments/webhook
```

Handled events:
- `payment_intent.succeeded` → marks payment as `SUCCESS`
- `payment_intent.payment_failed` → marks payment as `FAILED`

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `JWT_SECRET` | HS256 secret (Base64) | (development key) |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
