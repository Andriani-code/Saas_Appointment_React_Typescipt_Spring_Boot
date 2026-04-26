-- V4__change_availability_to_date_based.sql
-- Change availabilities table to be date-based instead of day-of-week based

ALTER TABLE availabilities ADD COLUMN date DATE;
-- For existing data, we might just clear it as it's a template, or leave it null.
-- But since we want "real dates", better to start fresh or migrate based on current year.

-- Remove day_of_week requirement and columns that are no longer strictly template-only
ALTER TABLE availabilities ALTER COLUMN day_of_week DROP NOT NULL;
ALTER TABLE availabilities ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE availabilities ALTER COLUMN end_time DROP NOT NULL;
ALTER TABLE availabilities ALTER COLUMN interval_minutes DROP NOT NULL;

-- Add check for future dates
-- Note: DB level check might be hard for "current_date", so we'll do it in Java logic mostly.

-- Update available_slots to ensure it follows the same logic (it already has date)
