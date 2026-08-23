-- Additive social/profile fields. Existing users, credentials and sessions are preserved.
ALTER TABLE users ADD COLUMN avatar_updated_at TEXT;
ALTER TABLE users ADD COLUMN show_online_status INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN show_current_game INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN presence_seen_at TEXT;
ALTER TABLE users ADD COLUMN current_game_id TEXT;
ALTER TABLE users ADD COLUMN current_game_title TEXT;

CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','accepted','blocked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(requester_id <> addressee_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS friendships_unique_pair
  ON friendships(min(requester_id,addressee_id),max(requester_id,addressee_id));
CREATE INDEX IF NOT EXISTS friendships_requester ON friendships(requester_id,status);
CREATE INDEX IF NOT EXISTS friendships_addressee ON friendships(addressee_id,status);

CREATE TABLE IF NOT EXISTS avatar_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS avatar_uploads_user_time ON avatar_uploads(user_id,created_at);
