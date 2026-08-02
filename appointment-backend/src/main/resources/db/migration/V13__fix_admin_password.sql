-- V13__fix_admin_password.sql
-- Corrige le mot de passe admin (Admin@1234 — BCrypt)
-- Le hash inséré par V2 ne correspondait pas au mot de passe documenté.
UPDATE users
SET password = '$2b$12$z6ZHUnFjd5B6Kk3DCo7WqOWDK2Xi7nuVDqJnNOoPHP5kODbK3MgWy'
WHERE email = 'admin@appointment.app'
  AND role = 'ADMIN';
