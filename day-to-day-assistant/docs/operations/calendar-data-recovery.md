# Calendar Data Recovery

Calendar data is stored locally in the application database. Before recovery, stop the local development server and copy the SQLite database file to a timestamped backup.

For accidental event deletion, check archived events first because Phase 4 delete requests archive events to preserve history. For source calendar problems, inspect `calendars`, `calendar_events`, and related link tables.

After restoring or editing data, run migrations, health checks, and the calendar test suite before resuming normal use.
