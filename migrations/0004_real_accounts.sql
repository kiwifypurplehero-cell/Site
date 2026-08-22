PRAGMA foreign_keys = OFF;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_normalized TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  library_view TEXT NOT NULL DEFAULT 'detailed' CHECK(library_view IN ('detailed','list','icons')),
  live_wallpaper TEXT NOT NULL DEFAULT 'none',
  settings_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

-- Preserve anonymous history as a read-only archive rather than silently attaching
-- it to a newly registered account.
ALTER TABLE play_sessions RENAME TO anonymous_play_sessions;
ALTER TABLE play_stats RENAME TO anonymous_play_stats;

CREATE TABLE play_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  last_heartbeat_at TEXT NOT NULL
);

CREATE TABLE play_stats (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id),
  total_seconds INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  last_played_at TEXT NOT NULL,
  PRIMARY KEY(user_id, game_id)
);
CREATE INDEX idx_play_sessions_user_started ON play_sessions(user_id, started_at DESC);
CREATE INDEX idx_play_stats_user_total ON play_stats(user_id, total_seconds DESC);

PRAGMA foreign_keys = ON;
