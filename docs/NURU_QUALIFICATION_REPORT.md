# Nuru Recovery Qualification Report

## Scope

This recovery branch was reconstructed from clean base `a50b8c350c2397e49127b699dc75366381071474` without modifying the original dirty workspace. The approved Nuru boundary contains 495 paths: direct Nuru implementation, reviewed shared dependencies, migrations, configuration hunks, and tests.

## Verification

- `npx prisma validate --schema prisma/schema.prisma` — passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed.
- `npm run test:nuru:v1-release` — passed: 20 test files, 59 tests.
- Nuru dashboard E2E — passed: 2 tests.
- Database-backed Tandem revision and Vault lifecycle E2E — passed together (2/2) against a disposable migrated and seeded PostgreSQL cluster at `localhost:55432`.

## Known limitation

The lifecycle test now waits for the remounted decision control to retain its entered rationale before submitting a governance action. This prevents a refresh/remount race from triggering client-side empty-rationale validation.

## Recovery decision

This branch is suitable for the final regression and release-candidate bundles.

## Final regression

The release-candidate branch passed the final gates on 2026-10-02:

- `npm run typecheck`
- `npm run test:nuru:v1-release` — 20 files and 59 tests
- `npm run build` — including standalone packaging

The `nuru-qualified-1` annotated tag identifies the exact qualified baseline commit.
