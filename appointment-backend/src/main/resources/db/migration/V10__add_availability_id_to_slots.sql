-- V10__add_availability_id_to_slots.sql
-- Trace the availability that produced each slot.

ALTER TABLE available_slots ADD COLUMN availability_id UUID REFERENCES availabilities(id) ON DELETE SET NULL;
CREATE INDEX idx_slots_availability ON available_slots(availability_id);
