# Nuru Recovery Qualification Report

## Scope

This recovery branch was reconstructed from clean base `a50b8c350c2397e49127b699dc75366381071474` without modifying the original dirty workspace. The approved Nuru boundary contains 495 paths: direct Nuru implementation, reviewed shared dependencies, migrations, configuration hunks, and tests.

## Verification

- `npx prisma validate --schema prisma/schema.prisma` — passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed.
- `npm run test:nuru:v1-release` — passed: 20 test files, 59 tests.
- Nuru dashboard E2E — passed: 2 tests.
- Database-backed Vault lifecycle E2E — passed against a disposable migrated and seeded PostgreSQL cluster at `localhost:55432`.
- Database-backed Tandem revision lifecycle E2E — passed in isolation against that cluster.

## Known limitation

The combined Tandem-and-Vault run has an unresolved cross-scenario flake: after the Tandem revision workflow, the subsequent approval POST can remain unresolved. Each lifecycle passes in isolation, so this is tracked as a test/runtime concurrency or cleanup issue rather than evidence of a schema or migration failure.

## Recovery decision

This branch is suitable for a qualified Nuru commit series. A release candidate still requires resolving the combined lifecycle flake and rerunning both workflows together from a fresh environment.
