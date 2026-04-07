-- Wyrdscape player state schema for Cloudflare D1 (SQLite).
-- Username-only login. State blob is opaque JSON owned by the client.

CREATE TABLE IF NOT EXISTS players (
  username TEXT PRIMARY KEY,
  state TEXT NOT NULL,           -- JSON player state (opaque to server)
  created_at INTEGER NOT NULL,   -- ms epoch
  updated_at INTEGER NOT NULL,   -- ms epoch
  play_time_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_players_updated ON players(updated_at);
