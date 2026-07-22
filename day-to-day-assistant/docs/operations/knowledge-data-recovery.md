# Knowledge Data Recovery

Before recovery, stop the development server and copy the SQLite database plus the local `data/attachments` directory to a timestamped backup.

Archived notes should be checked before attempting database-level recovery because delete requests archive notes in Phase 5. Versions can be restored through the API as long as `note_versions` rows remain.

If attachment metadata exists but a file is missing, treat the attachment as damaged and remove or replace it after preserving the backup copy.
