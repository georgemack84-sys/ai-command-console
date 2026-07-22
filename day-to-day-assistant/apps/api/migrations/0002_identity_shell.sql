CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  timezone TEXT NOT NULL,
  locale TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING_SETUP', 'ACTIVE', 'LOCKED', 'DISABLED')),
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_active
ON users(status)
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL,
  locale TEXT NOT NULL,
  display_density TEXT NOT NULL DEFAULT 'comfortable',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  revocation_reason TEXT,
  user_agent_summary TEXT,
  source_address_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier_hash TEXT NOT NULL,
  source_address_hash TEXT,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  first_failed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_failed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_hash ON login_attempts(identifier_hash);

CREATE TABLE IF NOT EXISTS audit_events_v2 (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('USER', 'SYSTEM', 'BACKGROUND_PROCESS')),
  actor_id TEXT,
  session_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  request_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCEEDED', 'FAILED', 'DENIED', 'CANCELLED', 'UNKNOWN')),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_v2_event_type ON audit_events_v2(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_v2_actor_id ON audit_events_v2(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_v2_session_id ON audit_events_v2(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_v2_request_id ON audit_events_v2(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_v2_occurred_at ON audit_events_v2(occurred_at);
