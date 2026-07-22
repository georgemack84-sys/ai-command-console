CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL')),
  content TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  prompt_version TEXT,
  token_usage TEXT NOT NULL DEFAULT '{}',
  structured_payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER NOT NULL DEFAULT 0,
  UNIQUE(prompt_id, version),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_versions_active
ON prompt_versions(prompt_id, is_active)
WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_id TEXT,
  message_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  request_tokens INTEGER NOT NULL DEFAULT 0,
  response_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  estimated_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('SUCCEEDED', 'FAILED')),
  error_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

CREATE TABLE IF NOT EXISTS provider_health (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('HEALTHY', 'DEGRADED', 'UNAVAILABLE')),
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  UNIQUE(provider, model)
);

CREATE TABLE IF NOT EXISTS ai_settings (
  user_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'mock',
  model TEXT NOT NULL DEFAULT 'mock-deterministic-v1',
  temperature REAL NOT NULL DEFAULT 0,
  max_tokens INTEGER NOT NULL DEFAULT 512,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS conversation_search_index USING fts5(
  user_id UNINDEXED,
  conversation_id UNINDEXED,
  title,
  message_content
);
