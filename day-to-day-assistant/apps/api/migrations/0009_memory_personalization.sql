CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Preference', 'Routine', 'Commitment', 'Reference', 'Interaction', 'Outcome', 'Correction')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1.0,
  sensitivity TEXT NOT NULL CHECK (sensitivity IN ('GENERAL', 'PERSONAL', 'SENSITIVE')),
  source_type TEXT NOT NULL CHECK (source_type IN ('USER_REQUEST', 'APPROVED_ROUTINE', 'EXPLICIT_PREFERENCE', 'SUCCESSFUL_WORKFLOW', 'SYSTEM_RULE')),
  source_id TEXT,
  retrieval_score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED', 'EXPIRED', 'DELETED')),
  valid_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_memories_user_status ON memories(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_valid_until ON memories(valid_until);

CREATE TABLE IF NOT EXISTS memory_versions (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence REAL NOT NULL,
  sensitivity TEXT NOT NULL,
  change_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memory_id) REFERENCES memories(id),
  UNIQUE(memory_id, version_number)
);

CREATE TABLE IF NOT EXISTS memory_proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.8,
  sensitivity TEXT NOT NULL DEFAULT 'GENERAL',
  valid_until TEXT,
  status TEXT NOT NULL CHECK (status IN ('PROPOSED', 'REMEMBERED', 'TEMPORARY', 'REJECTED', 'EXPIRED')),
  created_memory_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_memory_id) REFERENCES memories(id)
);

CREATE INDEX IF NOT EXISTS idx_memory_proposals_user_status ON memory_proposals(user_id, status);

CREATE TABLE IF NOT EXISTS preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  source TEXT NOT NULL CHECK (source IN ('EXPLICIT', 'LEARNED')),
  confidence REAL NOT NULL DEFAULT 1.0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, key, source)
);

CREATE INDEX IF NOT EXISTS idx_preferences_user_key ON preferences(user_id, key);

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  satisfaction INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS routine_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cadence TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROPOSED', 'ACTIVE', 'ARCHIVED')),
  source_memory_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (source_memory_id) REFERENCES memories(id)
);

CREATE TABLE IF NOT EXISTS memory_retrievals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  memory_ids TEXT NOT NULL DEFAULT '[]',
  retrieval_reason TEXT NOT NULL,
  relevance TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS memory_privacy_settings (
  user_id TEXT PRIMARY KEY,
  memory_enabled INTEGER NOT NULL DEFAULT 1,
  disabled_categories TEXT NOT NULL DEFAULT '[]',
  personalization_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
