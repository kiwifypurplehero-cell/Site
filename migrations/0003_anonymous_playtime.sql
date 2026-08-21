PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  system TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  cover_url TEXT NOT NULL DEFAULT '',
  UNIQUE(source, system, source_key)
);

CREATE TABLE IF NOT EXISTS play_sessions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  last_heartbeat_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS play_stats (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id),
  total_seconds INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  last_played_at TEXT NOT NULL,
  PRIMARY KEY(player_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_play_sessions_player_started ON play_sessions(player_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_play_sessions_player_game_started ON play_sessions(player_id, game_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_play_stats_player_total ON play_stats(player_id, total_seconds DESC);

