# Note Versioning

Every note starts at version 1. Material edits to title, Markdown content, or summary increment the note version and insert a `note_versions` row.

Restoring an old version copies that version into the live note and writes a new version number. Previous versions remain recoverable.

Draft autosave is browser-local and does not create server-side history entries until the user saves.
