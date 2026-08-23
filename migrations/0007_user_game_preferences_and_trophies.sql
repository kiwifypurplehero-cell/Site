-- Additive personal-library data. Existing users, sessions and preferences are untouched.
CREATE TABLE IF NOT EXISTS user_game_preferences (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating IS NULL OR rating IN (-1, 1)),
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, game_id)
);
CREATE INDEX IF NOT EXISTS idx_user_game_preferences_favorites ON user_game_preferences(user_id, favorite, updated_at DESC);

CREATE TABLE IF NOT EXISTS user_trophies (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trophy_id TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  PRIMARY KEY (user_id, trophy_id)
);
CREATE INDEX IF NOT EXISTS idx_user_trophies_profile ON user_trophies(user_id, pinned DESC, earned_at DESC);
