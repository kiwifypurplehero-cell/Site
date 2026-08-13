-- Catálogo público enviado pela comunidade. Independente de qualquer sistema de contas.
CREATE TABLE IF NOT EXISTS community_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  creator TEXT NOT NULL CHECK(length(creator) BETWEEN 1 AND 100),
  github_owner TEXT NOT NULL COLLATE NOCASE,
  github_repo TEXT NOT NULL COLLATE NOCASE,
  github_url TEXT NOT NULL,
  play_url TEXT,
  game_type TEXT NOT NULL CHECK(game_type IN ('html','windows','linux','android','other')),
  description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 1000),
  platform TEXT NOT NULL CHECK(length(platform) BETWEEN 1 AND 80),
  cover_url TEXT,
  license TEXT,
  language TEXT,
  stars INTEGER NOT NULL DEFAULT 0 CHECK(stars >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden')),
  UNIQUE(github_owner, github_repo)
);
CREATE INDEX IF NOT EXISTS community_games_status_submitted_idx ON community_games(status, submitted_at DESC);
