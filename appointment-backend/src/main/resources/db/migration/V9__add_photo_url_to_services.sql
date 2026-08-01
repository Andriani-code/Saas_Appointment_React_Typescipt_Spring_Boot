-- V9__add_photo_url_to_services.sql
-- Add a photo to each service offering.

ALTER TABLE provider_services ADD COLUMN photo_url VARCHAR(500);
