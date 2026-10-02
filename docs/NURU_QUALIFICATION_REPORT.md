# Nuru Recovery Qualification Report

## Scope

This recovery branch was reconstructed from clean base `a50b8c350c2397e49127b699dc75366381071474` without modifying the original dirty workspace. The approved Nuru boundary contains 495 paths: direct Nuru implementation, reviewed shared dependencies, migrations, configuration hunks, and tests.

## Verification

- `npx prisma validate --schema prisma/schema.prisma` — passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed.
- `npm run test:nuru:v1-release` — passed: 20 test files, 59 tests.
- Nuru dashboard E2E — passed: 2 tests.
- Database-backed lifecycle E2E specs — correctly skipped by their explicit readiness guard because local PostgreSQL at `localhost:55432` was unavailable.

## Known limitation

The full application production build remains blocked by three pre-existing, out-of-boundary durable-learning imports whose implementation files are absent from the clean base. After Nuru dependency closure, the build reports no Nuru module-resolution errors. This limitation does not alter the Nuru boundary or the original dirty workspace.

## Recovery decision

This branch is suitable for a qualified Nuru commit series. A release candidate still requires a fresh environment with PostgreSQL available to execute the guarded lifecycle E2E scenarios and to resolve the unrelated durable-learning build blocker.
