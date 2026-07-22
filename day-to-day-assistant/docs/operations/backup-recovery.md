# Backup and Recovery

Phase D2D.12 stores operational backup metadata in SQLite and writes local backup files under `data/backups`.

## Backup

- Use the Operations page or `POST /api/v1/system/backup` for audited application backups.
- Use `scripts/backup/backup.ps1` for an offline filesystem backup.
- Each backup records schema version, application version, SHA-256 checksum, size, scope, and encryption metadata.

## Verification

Backups are not production evidence until verified. Verification checks the recorded checksum and SQLite `PRAGMA integrity_check`.

## Recovery

The application supports restore rehearsal by copying a verified backup into `data/restore-rehearsals` and validating it before any live restore. Live restore should be performed offline: stop the API, take a fresh backup of the current database, replace the database with the verified backup, run migrations, then run health and smoke tests.
