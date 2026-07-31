-- V8__rename_specialist_to_provider.sql
-- Generalize the concept: "specialist" becomes "provider" (coiffeur, esthéticienne, réparateur, ...)
-- Also adds a free-text "category" column to providers.

-- ─── Tables ─────────────────────────────────────────────────────────────────
ALTER TABLE specialists RENAME TO providers;
ALTER TABLE specialist_services RENAME TO provider_services;

-- ─── FK columns referencing providers ────────────────────────────────────────
ALTER TABLE provider_services    RENAME COLUMN specialist_id TO provider_id;
ALTER TABLE availabilities       RENAME COLUMN specialist_id TO provider_id;
ALTER TABLE available_slots      RENAME COLUMN specialist_id TO provider_id;
ALTER TABLE reservations         RENAME COLUMN specialist_id TO provider_id;
ALTER TABLE reviews              RENAME COLUMN specialist_id TO provider_id;
ALTER TABLE conversations        RENAME COLUMN specialist_id TO provider_id;
ALTER TABLE verification_requests RENAME COLUMN specialist_id TO provider_id;

-- ─── Role & sender_type: SPECIALIST -> PROVIDER ─────────────────────────────
ALTER TABLE users DROP CONSTRAINT users_role_check;
UPDATE users SET role = 'PROVIDER' WHERE role = 'SPECIALIST';
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN','CLIENT','PROVIDER'));

ALTER TABLE messages DROP CONSTRAINT messages_sender_type_check;
UPDATE messages SET sender_type = 'PROVIDER' WHERE sender_type = 'SPECIALIST';
ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check
    CHECK (sender_type IN ('CLIENT','PROVIDER'));

-- ─── New column: free-text category (e.g. "Coiffeur", "Esthéticienne") ──────
ALTER TABLE providers ADD COLUMN category VARCHAR(200);

-- ─── Rename indexes for consistency ─────────────────────────────────────────
ALTER INDEX idx_specialists_user_id       RENAME TO idx_providers_user_id;
ALTER INDEX idx_specialists_verified      RENAME TO idx_providers_verified;
ALTER INDEX idx_slots_specialist_date     RENAME TO idx_slots_provider_date;
ALTER INDEX idx_reservations_specialist   RENAME TO idx_reservations_provider;
ALTER INDEX idx_reviews_specialist        RENAME TO idx_reviews_provider;
ALTER INDEX idx_verification_requests_specialist
                                           RENAME TO idx_verification_requests_provider;
