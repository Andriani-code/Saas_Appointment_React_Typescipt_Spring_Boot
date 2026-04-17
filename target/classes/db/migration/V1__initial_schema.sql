-- V1__initial_schema.sql
-- Appointment Booking Platform - Initial Database Schema

-- ─── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN','CLIENT','SPECIALIST')),
    provider    VARCHAR(20)  NOT NULL DEFAULT 'LOCAL' CHECK (provider IN ('LOCAL','GOOGLE')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Addresses ──────────────────────────────────────────────────────────────
CREATE TABLE addresses (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    country      VARCHAR(100) NOT NULL,
    region       VARCHAR(100),
    city         VARCHAR(100) NOT NULL,
    district     VARCHAR(100),
    address_line VARCHAR(255),
    latitude     NUMERIC(10,8),
    longitude    NUMERIC(11,8),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Clients ────────────────────────────────────────────────────────────────
CREATE TABLE clients (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(30),
    profile_photo VARCHAR(500),
    address_id    UUID         REFERENCES addresses(id) ON DELETE SET NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Specialists ────────────────────────────────────────────────────────────
CREATE TABLE specialists (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(30),
    display_name        VARCHAR(150),
    profile_title       VARCHAR(200),
    bio                 TEXT,
    profile_photo       VARCHAR(500),
    cover_photo         VARCHAR(500),
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (verification_status IN ('PENDING','APPROVED','REJECTED')),
    personal_address_id UUID         REFERENCES addresses(id) ON DELETE SET NULL,
    service_address_id  UUID         REFERENCES addresses(id) ON DELETE SET NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Specialist Services ─────────────────────────────────────────────────────
CREATE TABLE specialist_services (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id    UUID           NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    name             VARCHAR(200)   NOT NULL,
    description      TEXT,
    duration_minutes INTEGER        NOT NULL CHECK (duration_minutes >= 15),
    price            NUMERIC(10,2)  NOT NULL CHECK (price > 0),
    deposit_enabled  BOOLEAN        NOT NULL DEFAULT FALSE,
    deposit_amount   NUMERIC(10,2),
    is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_deposit CHECK (
        deposit_enabled = FALSE OR
        (deposit_amount IS NOT NULL AND deposit_amount <= price)
    )
);

-- ─── Availabilities ──────────────────────────────────────────────────────────
CREATE TABLE availabilities (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id    UUID        NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    day_of_week      VARCHAR(15) NOT NULL
                        CHECK (day_of_week IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')),
    start_time       TIME        NOT NULL,
    end_time         TIME        NOT NULL,
    interval_minutes INTEGER     NOT NULL CHECK (interval_minutes >= 15),
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_specialist_day UNIQUE (specialist_id, day_of_week),
    CONSTRAINT chk_time_range CHECK (start_time < end_time)
);

-- ─── Available Slots ─────────────────────────────────────────────────────────
CREATE TABLE available_slots (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID        NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    service_id    UUID        REFERENCES specialist_services(id) ON DELETE SET NULL,
    date          DATE        NOT NULL,
    start_time    TIME        NOT NULL,
    end_time      TIME        NOT NULL,
    status        VARCHAR(15) NOT NULL DEFAULT 'AVAILABLE'
                     CHECK (status IN ('AVAILABLE','BOOKED','BLOCKED')),
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_slot UNIQUE (specialist_id, date, start_time)
);

-- ─── Reservations ────────────────────────────────────────────────────────────
CREATE TABLE reservations (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID           NOT NULL REFERENCES clients(id),
    specialist_id    UUID           NOT NULL REFERENCES specialists(id),
    service_id       UUID           NOT NULL REFERENCES specialist_services(id),
    slot_id          UUID           NOT NULL UNIQUE REFERENCES available_slots(id),
    status           VARCHAR(15)    NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','CONFIRMED','REJECTED','CANCELED','COMPLETED','NO_SHOW')),
    client_message   TEXT,
    deposit_required BOOLEAN        NOT NULL DEFAULT FALSE,
    deposit_amount   NUMERIC(10,2),
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE payments (
    id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id            UUID          NOT NULL UNIQUE REFERENCES reservations(id),
    amount                    NUMERIC(10,2) NOT NULL,
    method                    VARCHAR(20)   NOT NULL DEFAULT 'STRIPE',
    status                    VARCHAR(15)   NOT NULL DEFAULT 'PENDING'
                                 CHECK (status IN ('PENDING','SUCCESS','FAILED')),
    stripe_payment_intent_id  VARCHAR(255),
    created_at                TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id      UUID      NOT NULL REFERENCES clients(id),
    specialist_id  UUID      NOT NULL REFERENCES specialists(id),
    reservation_id UUID      NOT NULL UNIQUE REFERENCES reservations(id),
    rating         SMALLINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    is_visible     BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_client_reservation_review UNIQUE (client_id, reservation_id)
);

-- ─── Conversations ───────────────────────────────────────────────────────────
CREATE TABLE conversations (
    id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id      UUID      NOT NULL REFERENCES clients(id),
    specialist_id  UUID      NOT NULL REFERENCES specialists(id),
    reservation_id UUID      REFERENCES reservations(id) ON DELETE SET NULL,
    is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id  UUID        NOT NULL REFERENCES users(id),
    sender_type     VARCHAR(15) NOT NULL CHECK (sender_type IN ('CLIENT','SPECIALIST')),
    content         TEXT        NOT NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_specialists_user_id ON specialists(user_id);
CREATE INDEX idx_specialists_verified ON specialists(is_active, is_verified);
CREATE INDEX idx_addresses_coords ON addresses(latitude, longitude);
CREATE INDEX idx_slots_specialist_date ON available_slots(specialist_id, date, status);
CREATE INDEX idx_reservations_client ON reservations(client_id, status);
CREATE INDEX idx_reservations_specialist ON reservations(specialist_id, status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read, sender_user_id);
CREATE INDEX idx_reviews_specialist ON reviews(specialist_id, is_visible);
