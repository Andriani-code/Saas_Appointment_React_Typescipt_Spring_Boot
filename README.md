# BookDoc — Appointment Booking Platform

A full-stack SaaS appointment booking platform built with **Spring Boot 3 (Java 21)** on the backend and **React + TypeScript + Vite** on the frontend.

---

## Architecture

```
SPRING-APPOINTMENT/
├── appointment-backend/   # Spring Boot 3 REST API (+ Dockerfile)
├── appointment-frontend/  # React + Vite SPA (+ Dockerfile + nginx.conf)
├── docker-compose.yml     # postgres + backend + frontend (all-in-one)
├── .env.example           # Documented Docker environment variables
└── .github/               # GitHub Actions CI/CD
```

---

## Quick Start — Docker (recommended)

The simplest way: the whole project (PostgreSQL + API + Frontend) starts with a single command.

### Prerequisites

- **Docker** with **Docker Compose** (Docker Desktop on Windows/Mac)

### Start

```bash
docker compose up -d --build
```

The 3 services are then available at:

| Service   | URL                          |
| --------- | ---------------------------- |
| Frontend  | http://localhost:5173        |
| API       | http://localhost:8080        |
| Swagger   | http://localhost:8080/swagger-ui.html |
| Postgres  | localhost:5432 (postgres / password)  |

> The initial build downloads the images and compiles both applications (Maven for the backend, npm for the frontend): allow a few minutes on first run.

### Environment variables

Copy the `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env          # Linux / macOS
copy .env.example .env        # Windows (cmd)
```

| Variable              | Role                              | Default |
| --------------------- | --------------------------------- | ------- |
| `JWT_SECRET`          | JWT signing key                   | dev key (change it!) |
| `STRIPE_SECRET_KEY`   | Stripe key (payments)             | empty -> payments disabled |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret           | empty |
| `MAIL_USERNAME`       | SMTP account (emails)             | empty -> emails disabled |
| `MAIL_PASSWORD`       | SMTP password                     | empty |

> Without a real Stripe / SMTP key, the application still starts normally — only payments and email notifications are inactive.

### Useful commands

```bash
docker compose ps                 # service status
docker compose logs -f backend    # API logs
docker compose logs -f frontend   # frontend logs
docker compose down               # stop (keeps the data)
docker compose down -v            # stop + remove the Postgres volume (data loss!)
```

---

## Tech Stack

### Backend

| Layer       | Technology                     |
| ----------- | ------------------------------ |
| Language    | Java 21                        |
| Framework   | Spring Boot 3.2                |
| Security    | Spring Security + JWT (JJWT)   |
| Persistence | Spring Data JPA / Hibernate    |
| Database    | PostgreSQL                     |
| Migrations  | Flyway                         |
| Mapping     | MapStruct                      |
| API Docs    | SpringDoc OpenAPI / Swagger UI |
| Payments    | Stripe                         |
| Messaging   | WebSocket (STOMP)              |

### Frontend

| Layer     | Technology               |
| --------- | ------------------------ |
| Framework | React 18 + TypeScript    |
| Bundler   | Vite 5                   |
| Styling   | Tailwind CSS 3           |
| Routing   | React Router DOM 6       |
| HTTP      | Axios (JWT interceptors) |
| Icons     | Lucide React             |

---

## Quick Start — Local development (without Docker)

### Prerequisites

- **Backend**: Java 21, Maven 3.9+, PostgreSQL 15+
- **Frontend**: Node.js 18+, npm/yarn

### 1. Database Setup

```sql
CREATE DATABASE appointment;
```

### 2. Backend Configuration

Set environment variables (or edit `application.yml`):

```bash
export DB_USERNAME=postgres
export DB_PASSWORD=yourpassword
export JWT_SECRET=your_jwt_secret_key
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Run Backend

```bash
cd appointment-backend
mvn spring-boot:run
```

- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

### 4. Run Frontend

```bash
cd appointment-frontend
npm install
npm run dev
```

- **Frontend**: http://localhost:5173

> The Vite proxy automatically forwards `/api` requests to the backend at `http://localhost:8080`.

---

## Project Structure

### Backend (`appointment-backend/`)

```
src/main/java/com/app/
├── config/          # Security, JWT, Stripe, WebSocket, OpenAPI
├── security/        # JWT service, filters, authentication
├── controller/      # REST endpoints
├── service/impl/    # Business logic
├── repository/      # JPA repositories
├── entity/          # Domain models + enums
├── dto/             # Request/Response DTOs
├── mapper/          # MapStruct mappers
├── exception/       # Global error handling
└── util/            # Utilities
```

### Frontend (`appointment-frontend/`)

```
src/
├── components/      # UI components (Button, Input, Cards...)
├── pages/           # Route pages (Login, Dashboard, Specialists...)
├── layouts/         # MainLayout with sidebar navigation
├── hooks/           # useAuth (authentication context)
├── services/        # API client + endpoints
├── types/           # TypeScript interfaces
└── utils/           # Helper functions
```

---

## Default Admin Account

Automatically created by Flyway migration (available with Docker and local setup):

| Field    | Value             |
| -------- | ----------------- |
| Email    | admin@bookdoc.com |
| Password | admin123          |

---

## API Documentation

Once the backend is running, visit:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

---

## Build Production

### Frontend

```bash
cd appointment-frontend
npm run build
npm run preview
```

---

## License

MIT
