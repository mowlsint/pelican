-- Public schema only; DOES NOT contain codebook mappings.
CREATE TABLE IF NOT EXISTS pelican_docs (key TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pelican_grants (
  email TEXT NOT NULL COLLATE NOCASE,
  table_id TEXT NOT NULL,
  can_encode INTEGER NOT NULL DEFAULT 0 CHECK(can_encode IN (0,1)),
  can_decode INTEGER NOT NULL DEFAULT 1 CHECK(can_decode IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  PRIMARY KEY(email,table_id)
);
CREATE INDEX IF NOT EXISTS grants_by_email ON pelican_grants(email,active);
