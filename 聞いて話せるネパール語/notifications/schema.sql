CREATE TABLE IF NOT EXISTS subscriptions (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  installation TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL CHECK (lang IN ('ja','en','ko','ar')),
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  translations TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('article','queued','accepted','expired')),
  audience_end INTEGER NOT NULL DEFAULT 0,
  cursor INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  accepted INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS announcements_latest ON announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS announcements_queue ON announcements(state, published_at);

CREATE TABLE IF NOT EXISTS receipts (
  ticket TEXT PRIMARY KEY,
  announcement TEXT NOT NULL REFERENCES announcements(id),
  token TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS receipts_due ON receipts(due_at);
