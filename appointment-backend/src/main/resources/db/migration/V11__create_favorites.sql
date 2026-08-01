-- V11__create_favorites.sql
-- Direct Client ↔ Provider relationship: a client can favorite providers.

CREATE TABLE favorites (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID      NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    provider_id UUID      NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_client_provider_favorite UNIQUE (client_id, provider_id)
);

CREATE INDEX idx_favorites_client   ON favorites(client_id);
CREATE INDEX idx_favorites_provider ON favorites(provider_id);
