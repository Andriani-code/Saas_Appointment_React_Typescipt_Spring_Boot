-- V7__add_email_verification_and_reminders.sql
-- Add email verification status to users
ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;

-- Add reminder tracking to reservations
ALTER TABLE reservations ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Update specialists verification_status default if not already consistent
-- V3 already set it to 'NONE', but ensuring it's correct
ALTER TABLE specialists ALTER COLUMN verification_status SET DEFAULT 'NONE';
