# Nuru Release Work Bundles

## WB-01 — Database-backed lifecycle closure

**Objective:** Complete and record the governed Tandem and Vault browser workflows against the disposable PostgreSQL cluster.

**Inputs:** `DATABASE_URL=postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public`; migrated and seeded database.

**Work:**

- Finish the combined Playwright run.
- If it exceeds its expected duration, capture the active request and isolate the workflow that is waiting.
- Keep the stabilized Tandem selectors and response synchronization.

**Acceptance:**

- Both lifecycle specs pass together with `desktop-chromium`.
- No skipped database guard remains.
- The run result is added to the qualification report.

## WB-02 — Qualification evidence and commit closure

**Objective:** Preserve the lifecycle evidence and commit only the associated test/bootstrap/report changes.

**Work:**

- Update `docs/NURU_QUALIFICATION_REPORT.md` with the database-backed results and disposable-cluster procedure.
- Commit the Tandem E2E stabilization and PostgreSQL service-selector repair separately from product runtime changes.

**Acceptance:**

- Commit messages identify the verification purpose.
- `git diff --check` passes.
- No generated database, Playwright, or build artifacts are committed.

## WB-03 — Release-candidate regression

**Objective:** Reconfirm the recovered baseline after the lifecycle changes.

**Work:**

- Run `npm run typecheck`.
- Run `npm run test:nuru:v1-release`.
- Run `npm run build`.

**Acceptance:**

- All three commands pass on the recovery branch.
- Any environment-only warning is recorded rather than suppressed.

## WB-04 — Qualified baseline handoff

**Objective:** Create a reproducible Nuru release-candidate record.

**Work:**

- Record the exact branch HEAD, Prisma migration state, test outcomes, and known limitations.
- Create the `nuru-qualified-1` tag after WB-01 through WB-03 pass.
- Open a PR from `codex/nuru-recovery-qualification`.

**Acceptance:**

- The report contains reproducible setup and verification commands.
- The tag resolves to the fully qualified commit.
- The PR contains only recovery, qualification, and explicitly separated shared-platform fixes.
