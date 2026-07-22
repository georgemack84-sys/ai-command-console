CREATE TABLE IF NOT EXISTS triggers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TIME', 'DATE', 'TASK_COMPLETED', 'EVENT_COMPLETED', 'FOLLOW_UP_DUE', 'REMINDER_TRIGGERED', 'SYSTEM_START', 'MANUAL')),
  configuration TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  timeout_seconds INTEGER NOT NULL DEFAULT 60,
  rollback_strategy TEXT NOT NULL DEFAULT 'BEST_EFFORT',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('READ', 'SEARCH', 'PLAN', 'CREATE', 'UPDATE', 'DELETE', 'WAIT', 'CONDITION', 'NOTIFY')),
  name TEXT NOT NULL,
  configuration TEXT NOT NULL DEFAULT '{}',
  retry_limit INTEGER NOT NULL DEFAULT 0,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  UNIQUE(workflow_id, position)
);

CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('ROUTINE', 'MONITOR', 'MAINTENANCE', 'WORKFLOW')),
  authority_level TEXT NOT NULL CHECK (authority_level IN ('LOW', 'MEDIUM', 'HIGH')),
  trigger_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED', 'ARCHIVED')),
  enabled INTEGER NOT NULL DEFAULT 1,
  read_scope TEXT NOT NULL DEFAULT '[]',
  write_scope TEXT NOT NULL DEFAULT '[]',
  confirmation_policy TEXT NOT NULL CHECK (confirmation_policy IN ('AUTOMATION_APPROVED', 'PER_RUN_CONFIRMATION')),
  catch_up_policy TEXT NOT NULL CHECK (catch_up_policy IN ('SKIP_MISSED', 'RUN_ONCE')),
  expires_at TEXT,
  last_run_at TEXT,
  next_run_at TEXT,
  retry_limit INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (trigger_id) REFERENCES triggers(id),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

CREATE INDEX IF NOT EXISTS idx_automations_user_status ON automations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON automations(next_run_at);

CREATE TABLE IF NOT EXISTS automation_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  automation_type TEXT NOT NULL,
  default_trigger TEXT NOT NULL DEFAULT '{}',
  default_workflow_steps TEXT NOT NULL DEFAULT '[]',
  authority_level TEXT NOT NULL DEFAULT 'LOW',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'SKIPPED')),
  started_at TEXT,
  completed_at TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automation_id) REFERENCES automations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_user ON automation_executions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_automation_executions_automation ON automation_executions(automation_id);

CREATE TABLE IF NOT EXISTS automation_step_executions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')),
  result TEXT NOT NULL DEFAULT '{}',
  action_proposal_id TEXT,
  action_execution_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES automation_executions(id),
  FOREIGN KEY (step_id) REFERENCES workflow_steps(id),
  FOREIGN KEY (action_proposal_id) REFERENCES action_proposals(id),
  FOREIGN KEY (action_execution_id) REFERENCES executions(id)
);

CREATE TABLE IF NOT EXISTS scheduler_jobs (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'CANCELLED')),
  idempotency_key TEXT NOT NULL,
  execution_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automation_id) REFERENCES automations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (execution_id) REFERENCES automation_executions(id),
  UNIQUE(user_id, idempotency_key)
);

INSERT INTO automation_templates(id, name, description, automation_type, default_trigger, default_workflow_steps, authority_level)
VALUES
  ('template-morning-briefing', 'Morning Briefing', 'Create a daily read-only briefing from today, tasks, calendar, and memory.', 'ROUTINE', '{"type":"TIME","schedule":"Daily","time":"08:00","timezone":"UTC"}', '[{"step_type":"READ","name":"Collect today summary","configuration":{"source":"today"}},{"step_type":"NOTIFY","name":"Record briefing notification","configuration":{"message":"Morning Briefing completed."}}]', 'LOW'),
  ('template-evening-review', 'Evening Review', 'Review open items near the end of the day.', 'ROUTINE', '{"type":"TIME","schedule":"Daily","time":"17:00","timezone":"UTC"}', '[{"step_type":"READ","name":"Collect open work","configuration":{"source":"today"}},{"step_type":"NOTIFY","name":"Record review notification","configuration":{"message":"Evening Review completed."}}]', 'LOW'),
  ('template-weekly-planning', 'Weekly Planning', 'Prepare a weekly planning prompt and recommendations.', 'ROUTINE', '{"type":"TIME","schedule":"Weekly","day_of_week":1,"time":"09:00","timezone":"UTC"}', '[{"step_type":"PLAN","name":"Plan the week","configuration":{"message":"Prepare weekly planning context."}},{"step_type":"NOTIFY","name":"Record planning notification","configuration":{"message":"Weekly Planning completed."}}]', 'LOW'),
  ('template-monthly-finance-review', 'Monthly Finance Review', 'Prompt a monthly finance review routine.', 'ROUTINE', '{"type":"TIME","schedule":"Monthly","day_of_month":1,"time":"09:00","timezone":"UTC"}', '[{"step_type":"NOTIFY","name":"Record finance review notification","configuration":{"message":"Monthly Finance Review is ready."}}]', 'LOW'),
  ('template-reminder-cleanup', 'Reminder Cleanup', 'Monitor due reminders and produce cleanup diagnostics.', 'MAINTENANCE', '{"type":"TIME","schedule":"Daily","time":"12:00","timezone":"UTC"}', '[{"step_type":"READ","name":"Inspect reminders","configuration":{"source":"reminders"}},{"step_type":"NOTIFY","name":"Record cleanup result","configuration":{"message":"Reminder Cleanup completed."}}]', 'LOW'),
  ('template-archive-completed-tasks', 'Archive Completed Tasks', 'Approved maintenance workflow for completed tasks.', 'MAINTENANCE', '{"type":"TIME","schedule":"Weekly","day_of_week":5,"time":"16:00","timezone":"UTC"}', '[{"step_type":"SEARCH","name":"Inspect completed tasks","configuration":{"source":"tasks","status":"COMPLETED"}},{"step_type":"NOTIFY","name":"Report archive candidates","configuration":{"message":"Archive Completed Tasks checked for candidates."}}]', 'LOW')
ON CONFLICT(name) DO NOTHING;
