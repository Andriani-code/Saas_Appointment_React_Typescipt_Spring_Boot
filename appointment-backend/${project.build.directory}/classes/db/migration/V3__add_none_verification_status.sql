-- V3__add_none_verification_status.sql
-- Add NONE to verification_status check constraint and change default

ALTER TABLE specialists DROP CONSTRAINT specialists_verification_status_check;

ALTER TABLE specialists ADD CONSTRAINT specialists_verification_status_check 
    CHECK (verification_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE specialists ALTER COLUMN verification_status SET DEFAULT 'NONE';

-- Update existing specialists that were PENDING to NONE if they haven't been processed
-- (This is a choice, assuming PENDING was the default for "just created")
UPDATE specialists SET verification_status = 'NONE' WHERE verification_status = 'PENDING';
