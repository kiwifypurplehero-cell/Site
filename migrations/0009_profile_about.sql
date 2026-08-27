-- Additive profile biography detail. Existing accounts, credentials and sessions are untouched.
ALTER TABLE users ADD COLUMN about TEXT NOT NULL DEFAULT '';
