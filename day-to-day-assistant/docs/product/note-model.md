# Note Model

Notes are local user-authored Markdown records. The canonical source is `content_markdown`; generated previews are derived views and must not replace the source record.

Each note belongs to one notebook, has `ACTIVE` or `ARCHIVED` state, carries an integer version, and can be favorited. Material edits create immutable `note_versions` rows. Restoring a version creates a new latest version rather than rewriting history.

Notes can have attachments, tags, outbound links to other records, and inbound backlinks from other notes.
