DROP INDEX IF EXISTS idx_action_proposals_status;

ALTER TABLE action_proposals RENAME TO legacy_action_proposals;

CREATE TABLE IF NOT EXISTS action_proposals (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  plan_id TEXT,
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  affected_records TEXT NOT NULL DEFAULT '[]',
  before_state TEXT NOT NULL DEFAULT '{}',
  after_state TEXT NOT NULL DEFAULT '{}',
  expected_changes TEXT NOT NULL DEFAULT '[]',
  risks TEXT NOT NULL DEFAULT '[]',
  reversibility TEXT NOT NULL DEFAULT 'Rollback unavailable',
  authority_level TEXT NOT NULL CHECK (authority_level IN ('LOW', 'MEDIUM', 'HIGH')),
  requires_confirmation INTEGER NOT NULL DEFAULT 1,
  estimated_execution_time_ms INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'AWAITING_CONFIRMATION', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
  expires_at TEXT NOT NULL,
  approved_at TEXT,
  executed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES request_log(id),
  FOREIGN KEY (plan_id) REFERENCES execution_plans(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_action_proposals_user_id ON action_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_action_proposals_status ON action_proposals(status);
CREATE INDEX IF NOT EXISTS idx_action_proposals_request ON action_proposals(request_id);

CREATE TABLE IF NOT EXISTS confirmations (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'CANCELLED')),
  confirmed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (proposal_id) REFERENCES action_proposals(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_confirmations_proposal ON confirmations(proposal_id);

CREATE TABLE IF NOT EXISTS action_tokens (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TEXT,
  FOREIGN KEY (proposal_id) REFERENCES action_proposals(id)
);

CREATE INDEX IF NOT EXISTS idx_action_tokens_proposal ON action_tokens(proposal_id);

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input_payload TEXT NOT NULL DEFAULT '{}',
  output_payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'EXECUTING', 'VERIFIED', 'FAILED', 'ROLLED_BACK', 'UNKNOWN')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'UNKNOWN')),
  idempotency_key TEXT NOT NULL,
  action_token_id TEXT,
  error_code TEXT,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES action_proposals(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (action_token_id) REFERENCES action_tokens(id),
  UNIQUE(user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_executions_proposal ON executions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

CREATE TABLE IF NOT EXISTS rollback_records (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  proposal_id TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('DELETE_CREATED_RECORD', 'RESTORE_PREVIOUS_STATE', 'REOPEN_TASK', 'RESTORE_EVENT', 'UNAVAILABLE')),
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'SUCCEEDED', 'FAILED')),
  resource_type TEXT,
  resource_id TEXT,
  before_state TEXT NOT NULL DEFAULT '{}',
  after_state TEXT NOT NULL DEFAULT '{}',
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (execution_id) REFERENCES executions(id),
  FOREIGN KEY (proposal_id) REFERENCES action_proposals(id)
);

CREATE TABLE IF NOT EXISTS approval_history (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ACTION_PROPOSED', 'ACTION_APPROVED', 'ACTION_REJECTED', 'ACTION_CANCELLED', 'ACTION_EXPIRED', 'ACTION_EXECUTED', 'ACTION_VERIFIED', 'ACTION_FAILED', 'ACTION_ROLLED_BACK')),
  note TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES action_proposals(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_approval_history_proposal ON approval_history(proposal_id);

CREATE TABLE IF NOT EXISTS execution_metrics (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  execution_id TEXT,
  user_id TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  verification_time_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('SUCCEEDED', 'FAILED', 'UNKNOWN')),
  tool_name TEXT NOT NULL,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES action_proposals(id),
  FOREIGN KEY (execution_id) REFERENCES executions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO tool_registry(id, name, description, input_schema, output_schema, read_only, is_enabled)
VALUES
  ('tool-write-task-create', 'task.create', 'Create a task after explicit proposal approval.', '{"title":"string","description":"string","priority":"NONE|LOW|MEDIUM|HIGH|URGENT","due_at":"iso8601"}', '{"task":"object"}', 0, 1),
  ('tool-write-task-update', 'task.update', 'Update task fields after explicit proposal approval.', '{"task_id":"uuid","changes":"object"}', '{"task":"object"}', 0, 1),
  ('tool-write-task-complete', 'task.complete', 'Complete an existing task after explicit proposal approval.', '{"task_id":"uuid"}', '{"task":"object"}', 0, 1),
  ('tool-write-reminder-create', 'reminder.create', 'Create a reminder after explicit proposal approval.', '{"title":"string","scheduled_at":"iso8601"}', '{"reminder":"object"}', 0, 1),
  ('tool-write-reminder-update', 'reminder.update', 'Snooze or update a reminder after explicit proposal approval.', '{"reminder_id":"uuid","snoozed_until":"iso8601"}', '{"reminder":"object"}', 0, 1),
  ('tool-write-reminder-cancel', 'reminder.cancel', 'Cancel a reminder after explicit proposal approval.', '{"reminder_id":"uuid"}', '{"reminder":"object"}', 0, 1),
  ('tool-write-calendar-event-create', 'calendar.event.create', 'Create a calendar event after explicit proposal approval.', '{"title":"string","start_at":"iso8601","end_at":"iso8601"}', '{"event":"object"}', 0, 1),
  ('tool-write-calendar-event-update', 'calendar.event.update', 'Update a calendar event after explicit proposal approval.', '{"event_id":"uuid","changes":"object"}', '{"event":"object"}', 0, 1),
  ('tool-write-calendar-event-cancel', 'calendar.event.cancel', 'Cancel a calendar event after explicit proposal approval.', '{"event_id":"uuid"}', '{"event":"object"}', 0, 1),
  ('tool-write-note-create', 'note.create', 'Create a note after explicit proposal approval.', '{"title":"string","content_markdown":"string"}', '{"note":"object"}', 0, 1),
  ('tool-write-note-update', 'note.update', 'Update a note after explicit proposal approval.', '{"note_id":"uuid","changes":"object"}', '{"note":"object"}', 0, 1),
  ('tool-write-followup-create', 'followup.create', 'Create a follow-up after explicit proposal approval.', '{"title":"string","responsible_party":"string"}', '{"followup":"object"}', 0, 1),
  ('tool-write-followup-update', 'followup.update', 'Update a follow-up after explicit proposal approval.', '{"followup_id":"uuid","changes":"object"}', '{"followup":"object"}', 0, 1)
ON CONFLICT(name) DO UPDATE SET
  description = excluded.description,
  input_schema = excluded.input_schema,
  output_schema = excluded.output_schema,
  read_only = 0,
  is_enabled = 1,
  updated_at = CURRENT_TIMESTAMP;
