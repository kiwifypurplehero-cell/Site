-- Additive activity tracking with a safe baseline for every existing account.
ALTER TABLE users ADD COLUMN last_active_at TEXT;
UPDATE users SET last_active_at = datetime('now')
WHERE last_active_at IS NULL;
CREATE INDEX IF NOT EXISTS users_last_active_at_idx ON users(last_active_at);
