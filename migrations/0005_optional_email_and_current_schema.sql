-- Align authentication with the existing numeric account schema while preserving
-- every account id and all dependent rows. D1 runs each migration once.
PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE,
  email TEXT COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'controller',
  bio TEXT NOT NULL DEFAULT '',
  is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0,1)),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new
  (id,username,email,password_hash,display_name,avatar,bio,is_public,role,created_at,updated_at)
SELECT id,username,email,password_hash,display_name,avatar,bio,is_public,role,created_at,updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
CREATE UNIQUE INDEX users_username_nocase_uq ON users(username COLLATE NOCASE);
CREATE UNIQUE INDEX users_email_nocase_uq ON users(email COLLATE NOCASE) WHERE email IS NOT NULL;

PRAGMA foreign_keys = ON;
