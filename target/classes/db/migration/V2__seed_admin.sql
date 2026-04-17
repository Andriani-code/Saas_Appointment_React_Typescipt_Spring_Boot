-- V2__seed_admin.sql
-- Default admin user (password: Admin@1234 — BCrypt encoded)
-- IMPORTANT: Change this password immediately in production!

INSERT INTO users (id, email, password, role, provider, is_active)
VALUES (
    gen_random_uuid(),
    'admin@appointment.app',
    '$2a$12$LF5zWAP2GEuCbEZkqfH8HO4xJw9xQkGRWD3UKNktK3szNK3p5GMvG',
    'ADMIN',
    'LOCAL',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
