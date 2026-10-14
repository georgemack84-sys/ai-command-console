# Application Platform Migration Guide (Prisma)

## Authority and scope

This guide governs the PostgreSQL schema used by the Next.js application
platform, governed workflows, and their Prisma models in `prisma/schema.prisma`.
Its migration ledger is `public._prisma_migrations` and its migration files are
under `prisma/migrations`.

It is independent of the .NET API's EF Core migration ledger. Do not copy,
rename, edit, or mark migrations from either persistence surface as applied in
the other. See [migrations.md](migrations.md) for the API-specific process.

## Qualification process

Before a Prisma migration chain can be accepted:

1. Create a uniquely named, disposable PostgreSQL database. Do not use a
   shared developer, staging, or production database.
2. Set `DATABASE_URL` only for the migration process to point at that database.
3. Apply the checked-in chain:

   ```powershell
   npx prisma migrate deploy --schema prisma/schema.prisma
   ```

4. Verify `public._prisma_migrations` has no unfinished or rolled-back rows.
5. Run the same deploy command again. It must report no pending migrations.
6. Run the relevant type, unit, configuration, and production-build checks.

## Recovery and rollback

Prisma migrations are forward-only. Never edit an applied migration or manually
change `_prisma_migrations` to make histories appear aligned.

- For a disposable qualification database, drop and recreate only the uniquely
  named database created for that qualification, then re-run the chain.
- For a shared environment, recover through a reviewed backup/restore plan or
  a new forward migration. Escalate before changing data or migration history.
- When a local database was created from another branch lineage, treat it as
  incompatible with this checkout. Rebuild it from the intended branch or use
  a dedicated disposable database; do not selectively import migration folders.

## Nuru reference integration configuration

The following values are configuration evidence, not authority grants:

| Variable | Purpose |
| --- | --- |
| `WORKFLOW_DISPATCH_MODE` | Remains `disabled` unless the local sandbox gate is explicitly enabled. |
| `WORKFLOW_SANDBOX_BASE_URL` | Sandbox target requiring separate verification and owner approval. |
| `WORKFLOW_STAGING_NURU_BASE_URL` | Deployment-secret staging endpoint for Nuru; never browser configuration. |
| `WORKFLOW_STAGING_HEADLINE_FLOW_BASE_URL` | Deployment-secret staging endpoint for Headline Flow; never browser configuration. |
