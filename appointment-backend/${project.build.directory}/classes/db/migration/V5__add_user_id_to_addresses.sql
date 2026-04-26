ALTER TABLE addresses ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
