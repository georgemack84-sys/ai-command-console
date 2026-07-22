CREATE TABLE IF NOT EXISTS notebooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_key TEXT NOT NULL DEFAULT 'blue',
  position INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notebooks_default
ON notebooks(user_id, is_default)
WHERE is_default = 1;

CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_archived ON notebooks(is_archived);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notebook_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  summary TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  is_favorite INTEGER NOT NULL DEFAULT 0,
  pinned_at TEXT,
  last_viewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_notebook_id ON notes(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);

CREATE TABLE IF NOT EXISTS note_versions (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author_type TEXT NOT NULL DEFAULT 'USER',
  UNIQUE(note_id, version_number),
  FOREIGN KEY (note_id) REFERENCES notes(id)
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  media_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(note_id, checksum),
  FOREIGN KEY (note_id) REFERENCES notes(id)
);

CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_checksum ON attachments(checksum);
CREATE INDEX IF NOT EXISTS idx_attachments_filename ON attachments(filename);

CREATE TABLE IF NOT EXISTS note_links (
  id TEXT PRIMARY KEY,
  source_note_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('NOTE', 'TASK', 'EVENT', 'FOLLOW_UP', 'REMINDER', 'PROJECT')),
  target_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('REFERENCE', 'BACKGROUND', 'MEETING_NOTES', 'PREPARATION', 'OUTCOME', 'RELATED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_note_id, target_type, target_id, relationship_type),
  FOREIGN KEY (source_note_id) REFERENCES notes(id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_type, target_id);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

CREATE VIRTUAL TABLE IF NOT EXISTS note_search_index USING fts5(
  user_id UNINDEXED,
  note_id UNINDEXED,
  title,
  content_markdown,
  notebook_name,
  tag_names,
  attachment_names
);
