-- V6__create_verification_requests.sql
-- Create verification_requests table for VerificationRequest entity
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL UNIQUE REFERENCES specialists(id) ON DELETE CASCADE,
    description TEXT,
    documents TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (status IN ('NONE','PENDING','APPROVED','REJECTED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optional index for specialist_id for faster lookup
CREATE INDEX idx_verification_requests_specialist ON verification_requests(specialist_id);
