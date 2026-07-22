# Phase 5 Qualification

Phase identifier: D2D.5
Phase name: Notes, Knowledge, and Search
Status: CONDITIONALLY_QUALIFIED

Qualified locally:

- Notebook CRUD, default notebook creation, archive/restore/default actions, and orphan prevention.
- Markdown notes with tags, favorites, archival, stale edit checks, and local preview.
- Immutable version history and restore that creates a new version.
- Attachment metadata, local file storage, checksum duplicate detection, and attachment search.
- Explicit note links to notes, tasks, calendar events, reminders, follow-ups, and projects.
- Backlinks for note-to-note relationships.
- SQLite FTS-backed deterministic search with fallback LIKE search.
- SPA pages for notes, notebooks, search, attachments, editor, preview, links, backlinks, and versions.
- Activity and audit events for knowledge operations.

Conditional items:

- Markdown preview is intentionally lightweight and not a full CommonMark renderer.
- Attachment upload is JSON/text/base64 based in the local API rather than browser multipart upload.
- Search is deterministic local FTS, not semantic retrieval.
- Browser end-to-end coverage remains smoke-level; service tests cover the main knowledge behavior.
