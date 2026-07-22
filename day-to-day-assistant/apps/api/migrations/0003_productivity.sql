CREATE TABLE IF NOT EXISTS task_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_lists_default
ON task_lists(user_id, is_default)
WHERE is_default = 1;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED')),
  start_date TEXT,
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('INBOX', 'PLANNED', 'IN_PROGRESS', 'WAITING', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'ARCHIVED')),
  previous_status TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  task_list_id TEXT,
  project_id TEXT,
  parent_task_id TEXT,
  due_at TEXT,
  start_at TEXT,
  estimated_minutes INTEGER,
  completed_at TEXT,
  cancelled_at TEXT,
  deferred_until TEXT,
  recurrence_rule_id TEXT,
  recurrence_series_id TEXT,
  previous_occurrence_id TEXT,
  occurrence_number INTEGER,
  scheduled_for TEXT,
  source_type TEXT NOT NULL DEFAULT 'USER',
  source_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_list_id) REFERENCES task_lists(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
  CHECK (parent_task_id IS NULL OR parent_task_id != id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deferred_until ON tasks(deferred_until);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_list_id ON tasks(task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);

CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  previous_state TEXT,
  new_state TEXT,
  changed_fields TEXT NOT NULL DEFAULT '[]',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_recurrence_rules (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  interval INTEGER NOT NULL DEFAULT 1,
  generation_policy TEXT NOT NULL DEFAULT 'ON_COMPLETION',
  timezone TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_recurrence_occurrence
ON tasks(recurrence_series_id, occurrence_number)
WHERE recurrence_series_id IS NOT NULL AND occurrence_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_type TEXT NOT NULL DEFAULT 'STANDALONE',
  related_id TEXT,
  scheduled_at TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'DUE', 'DELIVERED', 'ACKNOWLEDGED', 'SNOOZED', 'MISSED', 'COMPLETED', 'CANCELLED')),
  snoozed_until TEXT,
  recurrence_rule TEXT,
  delivery_channel TEXT NOT NULL DEFAULT 'IN_APP',
  last_delivery_at TEXT,
  acknowledged_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON reminders(scheduled_at);

CREATE TABLE IF NOT EXISTS reminder_jobs (
  id TEXT PRIMARY KEY,
  reminder_id TEXT NOT NULL,
  due_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CLAIMED', 'SUCCEEDED', 'FAILED', 'RETRY_SCHEDULED', 'DEAD_LETTER', 'CANCELLED')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  claimed_at TEXT,
  completed_at TEXT,
  error_code TEXT,
  next_attempt_at TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id)
);

CREATE INDEX IF NOT EXISTS idx_reminder_jobs_status ON reminder_jobs(status);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_due_at ON reminder_jobs(due_at);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id TEXT PRIMARY KEY,
  reminder_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  late INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id),
  FOREIGN KEY (job_id) REFERENCES reminder_jobs(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_type TEXT,
  related_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('UNREAD', 'READ', 'DISMISSED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  dismissed_at TEXT,
  UNIQUE(type, related_type, related_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'WAITING', 'RESOLVED', 'CANCELLED', 'ARCHIVED')),
  responsible_party TEXT,
  expected_result TEXT,
  source_type TEXT NOT NULL DEFAULT 'USER',
  source_id TEXT,
  due_at TEXT,
  review_at TEXT,
  priority TEXT NOT NULL DEFAULT 'NONE',
  last_contact_at TEXT,
  next_action TEXT,
  resolved_at TEXT,
  resolution_note TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_followups_user_id ON followups(user_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_due_at ON followups(due_at);
CREATE INDEX IF NOT EXISTS idx_followups_review_at ON followups(review_at);
CREATE INDEX IF NOT EXISTS idx_followups_priority ON followups(priority);
CREATE INDEX IF NOT EXISTS idx_followups_archived_at ON followups(archived_at);

CREATE TABLE IF NOT EXISTS followup_history (
  id TEXT PRIMARY KEY,
  followup_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  previous_state TEXT,
  new_state TEXT,
  changed_fields TEXT NOT NULL DEFAULT '[]',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (followup_id) REFERENCES followups(id)
);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_occurred_at ON activity_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_activity_events_resource ON activity_events(resource_type, resource_id);
