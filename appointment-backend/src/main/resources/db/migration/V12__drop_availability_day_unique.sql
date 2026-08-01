-- V12__drop_availability_day_unique.sql
-- The availabilities table became date-based in V4, so the legacy
-- UNIQUE (provider_id, day_of_week) constraint is obsolete: a provider
-- can have many availabilities on different dates with the same weekday.

ALTER TABLE availabilities DROP CONSTRAINT IF EXISTS uq_specialist_day;
