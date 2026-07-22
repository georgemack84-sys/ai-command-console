CREATE TABLE IF NOT EXISTS connector_registry (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  connector_type TEXT NOT NULL CHECK (connector_type IN ('EMAIL', 'CALENDAR', 'CONTACTS', 'STORAGE', 'NOTES', 'TASKS', 'DOCUMENTS')),
  display_name TEXT NOT NULL,
  capabilities TEXT NOT NULL DEFAULT '[]',
  supported_operations TEXT NOT NULL DEFAULT '[]',
  supported_permissions TEXT NOT NULL DEFAULT '[]',
  synchronization_modes TEXT NOT NULL DEFAULT '[]',
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, connector_type)
);

CREATE TABLE IF NOT EXISTS connectors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  connector_type TEXT NOT NULL CHECK (connector_type IN ('EMAIL', 'CALENDAR', 'CONTACTS', 'STORAGE', 'NOTES', 'TASKS', 'DOCUMENTS')),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DISCONNECTED', 'AUTHORIZING', 'CONNECTED', 'SYNCING', 'DEGRADED', 'ERROR', 'DISABLED')),
  authorization_state TEXT NOT NULL CHECK (authorization_state IN ('NONE', 'REQUESTED', 'AUTHORIZED', 'EXPIRED', 'REVOKED', 'ERROR')),
  requested_scopes TEXT NOT NULL DEFAULT '[]',
  granted_scopes TEXT NOT NULL DEFAULT '[]',
  synchronization_mode TEXT NOT NULL CHECK (synchronization_mode IN ('IMPORT_ONLY', 'EXPORT_ONLY', 'BIDIRECTIONAL')),
  sync_enabled INTEGER NOT NULL DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, provider, connector_type)
);

CREATE INDEX IF NOT EXISTS idx_connectors_user_status ON connectors(user_id, status);

CREATE TABLE IF NOT EXISTS connector_authorizations (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  access_token_ciphertext TEXT,
  refresh_token_ciphertext TEXT,
  provider_account_id TEXT,
  expires_at TEXT,
  refresh_status TEXT NOT NULL CHECK (refresh_status IN ('NOT_REQUIRED', 'VALID', 'REFRESHED', 'EXPIRED', 'REVOKED', 'FAILED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  FOREIGN KEY (connector_id) REFERENCES connectors(id)
);

CREATE INDEX IF NOT EXISTS idx_connector_authorizations_connector ON connector_authorizations(connector_id);

CREATE TABLE IF NOT EXISTS synchronizations (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('IMPORT_ONLY', 'EXPORT_ONLY', 'BIDIRECTIONAL')),
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'CONFLICT')),
  started_at TEXT,
  completed_at TEXT,
  imported_count INTEGER NOT NULL DEFAULT 0,
  exported_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  cursor TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connector_id) REFERENCES connectors(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_synchronizations_connector ON synchronizations(connector_id);
CREATE INDEX IF NOT EXISTS idx_synchronizations_user ON synchronizations(user_id, created_at);

CREATE TABLE IF NOT EXISTS external_links (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  local_type TEXT NOT NULL,
  local_id TEXT,
  external_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_checksum TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  sync_id TEXT,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connector_id) REFERENCES connectors(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (sync_id) REFERENCES synchronizations(id),
  UNIQUE(connector_id, external_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_external_links_user ON external_links(user_id, local_type, external_type);

CREATE TABLE IF NOT EXISTS connector_health (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('HEALTHY', 'DEGRADED', 'ERROR', 'DISCONNECTED')),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connector_id) REFERENCES connectors(id)
);

CREATE INDEX IF NOT EXISTS idx_connector_health_connector ON connector_health(connector_id, checked_at);

CREATE TABLE IF NOT EXISTS synchronization_conflicts (
  id TEXT PRIMARY KEY,
  synchronization_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  external_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  local_snapshot TEXT NOT NULL DEFAULT '{}',
  remote_snapshot TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'RESOLVED', 'CANCELLED')),
  resolution TEXT CHECK (resolution IN ('LOCAL', 'REMOTE', 'MERGE', 'CANCEL') OR resolution IS NULL),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY (synchronization_id) REFERENCES synchronizations(id),
  FOREIGN KEY (connector_id) REFERENCES connectors(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS external_records (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  record_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connector_id) REFERENCES connectors(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(connector_id, record_type, external_id)
);

INSERT INTO connector_registry(id, provider, connector_type, display_name, capabilities, supported_operations, supported_permissions, synchronization_modes)
VALUES
  ('provider-local-email', 'local-email', 'EMAIL', 'Local Email Connector', '["READ_EMAIL","SEND_EMAIL"]', '["connect","disconnect","health_check","authorize","refresh_authorization","synchronize","import","export"]', '["READ","SEND","SYNC"]', '["IMPORT_ONLY","EXPORT_ONLY","BIDIRECTIONAL"]'),
  ('provider-local-calendar', 'local-calendar', 'CALENDAR', 'Local Calendar Connector', '["READ_CALENDAR","WRITE_CALENDAR"]', '["connect","disconnect","health_check","authorize","refresh_authorization","synchronize","import","export"]', '["READ","WRITE","SYNC"]', '["IMPORT_ONLY","EXPORT_ONLY","BIDIRECTIONAL"]'),
  ('provider-local-contacts', 'local-contacts', 'CONTACTS', 'Local Contacts Connector', '["READ_CONTACTS"]', '["connect","disconnect","health_check","authorize","refresh_authorization","synchronize","import"]', '["READ","SYNC"]', '["IMPORT_ONLY"]'),
  ('provider-local-storage', 'local-storage', 'STORAGE', 'Local Storage Connector', '["READ_FILES"]', '["connect","disconnect","health_check","authorize","refresh_authorization","synchronize","import","export"]', '["READ","WRITE","SYNC"]', '["IMPORT_ONLY","EXPORT_ONLY","BIDIRECTIONAL"]')
ON CONFLICT(provider, connector_type) DO NOTHING;
