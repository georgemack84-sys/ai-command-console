# Search Index Repair

If note search results appear stale, run a local reindex by loading the affected user in the API and refreshing each note index through the notes service. The index is derived from canonical notebook, note, tag, and attachment tables.

For manual inspection, compare `notes`, `notebooks`, `note_tags`, `tags`, `attachments`, and `note_search_index` rows for the affected note.

The canonical records are the source of truth; the FTS table can be rebuilt.
