CREATE TABLE IF NOT EXISTS submissions (
 receipt TEXT PRIMARY KEY,
 participant TEXT NOT NULL,
 kind TEXT NOT NULL,
 payload TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON submissions(participant);
