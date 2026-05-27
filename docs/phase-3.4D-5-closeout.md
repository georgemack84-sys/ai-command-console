# Phase 3.4D-5 Closeout

## Scope

Phase 3.4D-5 was implemented as a repo-grounded hardening pass for lock ownership, lease semantics, and recovery-entry discipline in the existing `services/` runtime.

This phase did **not** introduce a new execution model, a second source of truth, or a replacement `stores/*` runtime. It tightened the existing D-2 through D-4 persistence and engine boundaries.

## What D-5 Changed

### 1. Explicit lease state on execution locks

The runtime `execution_locks` table now carries:

- `heartbeat_at`
- `lease_expires_at`

These fields are maintained in the same live SQLite runtime used by:

- `execution_state`
- normalized execution snapshot tables
- `execution_ledger`

### 2. Explicit lock renewal contract

The integrity store now supports explicit execution-lock renewal through:

- `renewExecutionLock(...)`
- `renewExecutionLockTx(...)`

Attempt heartbeats now renew the actual execution lock row, not only mirrored lease state on `executions`.

### 3. Lease lifecycle ledger visibility

Lock lifecycle transitions now append immutable ledger evidence inside the same transaction:

- `lease.acquired`
- `lease.renewed`
- `lease.released`
- `lease.conflict`

This makes lease ownership changes observable and reconstructable from durable history.

### 4. Explicit recovery preflight boundary

The engine now exposes:

- `preflightRecovery(plan, modes)`

This is a read-only eligibility pass for deterministic recovery. It checks:

- config validity
- persisted checkpoint / execution presence
- active execution lease
- active running-attempt lease
- integrity validity
- terminal and review-only checkpoint states
- timing / containment breaches
- next-step resolution from checkpoint

`recoverExecution(...)` now runs through the same preflight logic before acquiring the recovery lock.

## Repo-Grounded Contract

Phase D-5 remains grounded in the real runtime layer:

- `services/stateDatabase.js`
- `services/executionStateStore.js`
- `services/executionIntegrityStore.js`
- `services/executionEngine.js`

Canonical durable runtime truth remains:

1. `execution_state`
2. normalized execution snapshot tables
3. immutable `execution_ledger`

## Intentional Deviations From Literal Prompt

The original prompt assumed a simplified storage model centered on `stores/db.js` and a reduced table contract.

This repo does not use that as its canonical runtime.

Intentional repo-grounded deviations:

- D-5 was implemented in `services/*`, not as a new `stores/*` truth surface
- existing D-4 lifecycle helpers were retained
- event names follow the repo’s dot-style naming
- recovery preflight is built around the established checkpoint + snapshot + ledger model, not a reduced `execution_id/step_index` contract

## Verification

Focused lease/runtime slices:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/execution-integrity-store.test.ts
npx vitest run --config vitest.config.mjs tests/unit/operator-recovery.test.ts tests/unit/execution-checkpoint.test.ts
```

Broad regression sweep:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/transaction.rollback.test.ts tests/unit/transaction.commit.test.ts tests/unit/transaction.shared-context.test.ts tests/unit/transaction.no-internal-tx.test.ts tests/unit/lifecycle.atomic-terminal.test.ts tests/unit/lifecycle.atomic-rollback.test.ts tests/unit/lifecycle.atomic-lock-release.test.ts tests/unit/lifecycle.attempt-atomic.test.ts tests/unit/execution-state-store.test.ts tests/unit/execution-integrity-store.test.ts tests/unit/staged-execution.test.ts tests/unit/execution-checkpoint.test.ts tests/unit/runtime-control.test.ts tests/unit/operator-recovery.test.ts
```

Final green result:

- **14 files passed**
- **135 tests passed**

## Readiness

Phase 3.4D-5 is complete enough to move forward.

Why:

- lease ownership is now more explicit at the storage layer
- lock renewal is first-class instead of implicit
- lease lifecycle transitions are durably visible in the ledger
- recovery entry is now explicit and deterministic before mutation begins

Remaining work from later phases should build on this boundary rather than reinterpreting it.
