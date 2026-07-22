CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'MANUAL', 'SCHEDULED')),
  status TEXT NOT NULL CHECK (status IN ('CREATED', 'VERIFIED', 'FAILED')),
  application_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  file_path TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  encrypted INTEGER NOT NULL DEFAULT 0,
  encryption_note TEXT,
  includes TEXT NOT NULL DEFAULT '[]',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_backups_user_created ON backups(user_id, created_at);

CREATE TABLE IF NOT EXISTS restore_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  backup_id TEXT,
  restore_type TEXT NOT NULL CHECK (restore_type IN ('FULL', 'PARTIAL', 'VERIFY_ONLY', 'REHEARSAL')),
  status TEXT NOT NULL CHECK (status IN ('PREVIEWED', 'VERIFIED', 'STAGED', 'RESTORED', 'FAILED')),
  source_path TEXT NOT NULL,
  target_path TEXT,
  checksum_sha256 TEXT,
  schema_version TEXT,
  application_version TEXT,
  validation_summary TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (backup_id) REFERENCES backups(id)
);

CREATE INDEX IF NOT EXISTS idx_restore_history_user_created ON restore_history(user_id, created_at);

CREATE TABLE IF NOT EXISTS operational_checks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('READINESS', 'SECURITY', 'DEPENDENCY', 'MONITORING', 'DIAGNOSTIC')),
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS', 'WARN', 'FAIL')),
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  message TEXT NOT NULL,
  remediation TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_operational_checks_user_category ON operational_checks(user_id, category, created_at);

CREATE TABLE IF NOT EXISTS release_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  version TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'NOT_QUALIFIED')),
  checklist TEXT NOT NULL DEFAULT '{}',
  known_issues TEXT NOT NULL DEFAULT '[]',
  evidence TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  qualified_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_release_history_user_created ON release_history(user_id, created_at);

CREATE TABLE IF NOT EXISTS deployment_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  version TEXT NOT NULL,
  environment TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PLANNED', 'DEPLOYED', 'ROLLED_BACK', 'FAILED')),
  migration_version TEXT,
  health_state TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
