# Phase 3.4D-2 Closeout

## Scope

Phase 3.4D-2 established the deterministic execution recovery and state integrity layer for the runtime execution system.

Durable runtime truth for recovery and reconciliation is:

1. `execution_state`
2. normalized execution snapshot tables
3. immutable `execution_ledger`

The orchestration document remains derived runtime cache / UI-facing convenience state and is not recovery truth.

## What D-2 Changed

- Added DB-backed execution timing based on SQLite timestamps.
- Added runtime integrity tables:
  - `execution_locks`
  - `execution_attempts`
  - `execution_ledger`
  - `execution_recovery_queue`
- Added append-only ledger enforcement in SQLite.
- Added persisted lock acquisition / reuse / release helpers.
- Added persisted attempt creation, heartbeat, completion, failure, and cancellation helpers.
- Added checkpoint persistence and deterministic recovery helpers for `execution_state`.
- Added reconciliation / validation / replay services:
  - validation against checkpoint, snapshot, ledger, attempts, recovery queue, and locks
  - deterministic reconciliation under lock
  - replay summary and corruption diagnostics
- Wired start / recover / resume paths through persisted locks and integrity validation.
- Rehydrated paused and recovered runs from persisted execution snapshot state.
- Added structured state and corruption payloads to engine halt responses.
- Added atomic terminal reconciliation transitions so checkpoint, ledger, and lock release move together.
- Treated attempt-finalization persistence failures as hard execution failures instead of best-effort writes.
- Treated terminal lock-release failures as real failures instead of cleanup noise.

## Invariants Satisfied

- No partial checkpoint state may exist.
- No `execution_state` may be silently overwritten.
- Only one active execution per `planId`.
- No step with side effects may execute twice unsafely.
- Execution is restartable deterministically.
- Unsafe recovery paths pause for operator recovery / review.
- State transitions are reconstructable from the immutable ledger plus checkpoint and snapshot state.
- Corruption is detected and halts execution.
- Step execution occurs outside DB transactions.
- Ledger is append-only and immutable after commit.

## Runtime Layout Note

The execution runtime for this phase lives primarily under:

- `services/`

The repository also contains server-facing TypeScript services under:

- `src/server/services/`

There is no top-level `src/services/` directory in this repository.

## Final Test Command

```powershell
npx vitest run tests/unit/execution-reconciliation.test.ts tests/unit/execution-integrity-store.test.ts tests/unit/execution-checkpoint.test.ts tests/unit/staged-execution.test.ts tests/unit/execution-state-store.test.ts tests/unit/sqlite-recovery.test.ts tests/unit/runtime-control.test.ts tests/unit/console-runtime.test.ts
```

## Final Result

`179 / 179`
