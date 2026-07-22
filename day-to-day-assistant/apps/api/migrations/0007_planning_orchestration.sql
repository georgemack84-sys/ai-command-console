CREATE TABLE IF NOT EXISTS request_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  raw_request TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RECEIVED', 'UNDERSTOOD', 'CONTEXT_READY', 'PLANNED', 'RESPONDED', 'FAILED')),
  primary_intent TEXT NOT NULL,
  secondary_intents TEXT NOT NULL DEFAULT '[]',
  entities TEXT NOT NULL DEFAULT '[]',
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_request_log_user_id ON request_log(user_id);
CREATE INDEX IF NOT EXISTS idx_request_log_status ON request_log(status);
CREATE INDEX IF NOT EXISTS idx_request_log_created_at ON request_log(created_at);

CREATE TABLE IF NOT EXISTS context_packages (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  sources TEXT NOT NULL DEFAULT '[]',
  retrieved_records TEXT NOT NULL DEFAULT '[]',
  retrieval_reason TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES request_log(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_context_packages_request ON context_packages(request_id);

CREATE TABLE IF NOT EXISTS execution_plans (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  steps TEXT NOT NULL DEFAULT '[]',
  required_tools TEXT NOT NULL DEFAULT '[]',
  estimated_complexity TEXT NOT NULL CHECK (estimated_complexity IN ('LOW', 'MEDIUM', 'HIGH')),
  requires_confirmation INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES request_log(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_execution_plans_request ON execution_plans(request_id);
CREATE INDEX IF NOT EXISTS idx_execution_plans_user_id ON execution_plans(user_id);

CREATE TABLE IF NOT EXISTS tool_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  input_schema TEXT NOT NULL DEFAULT '{}',
  output_schema TEXT NOT NULL DEFAULT '{}',
  read_only INTEGER NOT NULL DEFAULT 1,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS planning_metrics (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  planning_time_ms INTEGER NOT NULL DEFAULT 0,
  context_record_count INTEGER NOT NULL DEFAULT 0,
  context_size_chars INTEGER NOT NULL DEFAULT 0,
  selected_tools TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('SUCCEEDED', 'FAILED')),
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES request_log(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_planning_metrics_user_id ON planning_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_metrics_created_at ON planning_metrics(created_at);
