# Restore Scripts

Phase D2D.12 supports safe restore rehearsal. Use `restore-rehearsal.ps1` to copy a backup into `data/restore-rehearsals` and run SQLite integrity validation.

Live restore is intentionally offline:

1. Stop the API and web server.
2. Back up the current database.
3. Verify the selected backup checksum and integrity.
4. Replace the configured database file.
5. Run migrations and health checks.
