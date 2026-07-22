CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  authority_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_type TEXT NOT NULL,
  status TEXT NOT NULL,
  authority_level TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_action_proposals_status ON action_proposals(status);
