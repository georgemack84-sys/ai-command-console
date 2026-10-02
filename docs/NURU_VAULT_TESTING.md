# Nuru Vault acceptance testing

`npm run test:vault:e2e` exercises the governed Vault lifecycle: approved
source, intake, human review, canonical promotion, supersession, retrieval, and
the provenance timeline.

The test must never use the development database. Set
`PLAYWRIGHT_DATABASE_URL` to a disposable PostgreSQL database that has the
repository migrations and seed data applied.

```powershell
$env:PLAYWRIGHT_DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5432/ai_command_console_playwright?schema=public'
npx prisma migrate deploy
npx prisma db seed
npm run test:vault:e2e
```

`PLAYWRIGHT_PORT` is optional and defaults to `5053`. Set it when another local
process owns that port. The focused runner uses its own Next build directory and
does not share the standard Playwright output with other browser tests.

Vault records are append-only by design. Reset or replace the disposable test
database between unrelated test runs; do not aim this command at development or
production data.

## Deterministic qualification fixtures

`src/nuru/vault-fixtures.ts` provides local, network-free fixtures for repeatable
qualification:

- `tinyVaultFixture`: one complete, canonical source-to-discovery trail.
- `historicalVaultFixture`: a retained superseded version and its current
  successor.
- `conflictedVaultFixture`: incompatible candidates that remain non-canonical
  until human governance chooses one.
- `poisonedVaultFixture`: intentionally invalid records that must fail contract
  validation before persistence.

Run their contract checks with:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/nuru-vault-fixtures.test.ts
```
