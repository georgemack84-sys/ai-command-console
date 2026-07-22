# Knowledge System

The knowledge system is implemented by `apps/api/src/day_to_day_assistant_api/notes.py` and migration `apps/api/migrations/0005_notes_knowledge_search.sql`.

The API owns notebook and note validation, version history, attachment checksum handling, tag normalization, explicit note links, backlinks, audit, activity events, and search indexing. Attachments are stored below the local data directory next to the SQLite database so backup scripts can include them.

The web SPA exposes notes, notebooks, search, attachments, a Markdown editor, preview, versions, links, backlinks, and attachment forms without requiring an AI provider.
