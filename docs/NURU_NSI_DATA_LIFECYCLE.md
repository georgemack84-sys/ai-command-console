# Nuru NSI data lifecycle

Raw artifacts are content-addressed and append-only. They are never rewritten or
deleted by application code: the database verifies their SHA-256 digest and byte
length on insertion and blocks updates and deletes. Repeated intake of identical
bytes for the same workspace and registered source reuses the existing artifact.

Production operators must use encrypted database volumes and encrypted backups,
with keys managed outside this repository and rotated under the platform key
management policy. Do not place raw bytes in logs, analytics, exports, or error
messages.

There is no automated raw-artifact deletion. Before any future retention purge,
the data/privacy owner must approve a retention period, legal-hold process,
export format, and a migration that preserves an auditable deletion record. A
legal hold overrides any scheduled deletion. This conservative default preserves
provenance until that policy exists.

Before backup, run `npm run nsi:verify-artifacts -- <workspace-id>` and retain
the returned manifest hash, artifact count, and artifact-linked audit-event count.
After restore, rerun it with `--expected-manifest`, `--expected-artifact-count`,
and `--expected-audit-event-count`. Retain both outputs, restore time, and backup
identifier as release evidence. Any mismatch is a release blocker.

The complete isolated-restore and proxy-validation procedure is in
[the NSI staging drill](NURU_NSI_STAGING_DRILL.md). A successful local
empty-workspace verification is not a substitute for that drill.
