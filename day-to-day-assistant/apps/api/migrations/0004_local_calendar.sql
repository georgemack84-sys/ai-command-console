CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_key TEXT NOT NULL DEFAULT 'blue',
  timezone TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  is_archived INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendars_default
ON calendars(user_id, is_default)
WHERE is_default = 1;

CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_visible ON calendars(is_visible);
CREATE INDEX IF NOT EXISTS idx_calendars_archived ON calendars(is_archived);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'TENTATIVE', 'CANCELLED', 'ARCHIVED')),
  event_type TEXT NOT NULL DEFAULT 'STANDARD',
  start_at TEXT,
  end_at TEXT,
  start_date TEXT,
  end_date TEXT,
  timezone TEXT NOT NULL,
  is_all_day INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'BUSY',
  visibility TEXT NOT NULL DEFAULT 'DEFAULT',
  recurrence_series_id TEXT,
  recurrence_rule_id TEXT,
  original_occurrence_at TEXT,
  parent_event_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'USER',
  source_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TEXT,
  archived_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (calendar_id) REFERENCES calendars(id),
  FOREIGN KEY (parent_event_id) REFERENCES calendar_events(id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_at ON calendar_events(end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_archived_at ON calendar_events(archived_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_series ON calendar_events(recurrence_series_id);

CREATE TABLE IF NOT EXISTS event_history (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  previous_state TEXT,
  new_state TEXT,
  changed_fields TEXT NOT NULL DEFAULT '[]',
  occurrence_scope TEXT NOT NULL DEFAULT 'ENTIRE_SERIES',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id)
);

CREATE TABLE IF NOT EXISTS event_recurrence_rules (
  id TEXT PRIMARY KEY,
  series_event_id TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  interval INTEGER NOT NULL DEFAULT 1,
  days_of_week TEXT,
  day_of_month INTEGER,
  week_of_month INTEGER,
  month_of_year INTEGER,
  start_local_time TEXT,
  duration_minutes INTEGER,
  timezone TEXT NOT NULL,
  end_type TEXT NOT NULL DEFAULT 'NEVER',
  end_at TEXT,
  occurrence_limit INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_event_id) REFERENCES calendar_events(id)
);

CREATE INDEX IF NOT EXISTS idx_event_recurrence_rules_series ON event_recurrence_rules(series_event_id);

CREATE TABLE IF NOT EXISTS event_recurrence_exceptions (
  id TEXT PRIMARY KEY,
  series_event_id TEXT NOT NULL,
  original_occurrence_at TEXT NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('MODIFIED', 'MOVED', 'CANCELLED')),
  replacement_event_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(series_event_id, original_occurrence_at),
  FOREIGN KEY (series_event_id) REFERENCES calendar_events(id),
  FOREIGN KEY (replacement_event_id) REFERENCES calendar_events(id)
);

CREATE TABLE IF NOT EXISTS event_reminder_links (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  reminder_id TEXT NOT NULL,
  offset_minutes INTEGER NOT NULL,
  delivery_at TEXT NOT NULL,
  occurrence_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, offset_minutes, occurrence_key),
  FOREIGN KEY (event_id) REFERENCES calendar_events(id),
  FOREIGN KEY (reminder_id) REFERENCES reminders(id)
);

CREATE TABLE IF NOT EXISTS event_preparation_items (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'COMPLETED', 'CANCELLED')),
  due_at TEXT,
  linked_task_id TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id),
  FOREIGN KEY (linked_task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS event_task_links (
  event_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id, task_id),
  FOREIGN KEY (event_id) REFERENCES calendar_events(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS event_followup_links (
  event_id TEXT NOT NULL,
  followup_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id, followup_id),
  FOREIGN KEY (event_id) REFERENCES calendar_events(id),
  FOREIGN KEY (followup_id) REFERENCES followups(id)
);
