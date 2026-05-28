# Phase 3.4D-4 Closeout

## Scope

Phase 3.4D-4 established execution boundaries and deterministic containment on top of the D-2 and D-3 runtime model.

It tightened the live execution system so it:

- does not run indefinitely
- does not retry indefinitely
- does not continue automatically through ambiguous crash seams
- does not keep working after lease loss
- routes unsafe or unclear side-effecting work to review
- reaches terminal, paused-for-review, operator-recovery, or corrupted outcomes deterministically

Durable runtime truth remains:

1. `execution_state`
2. normalized execution snapshot tables
3. immutable `execution_ledger`

No new execution model or competing runtime truth source was introduced.

## What D-4 Changed

- Added D-4 execution containment fields to the normalized runtime schema:
  - execution lease owner / expiry
  - total attempts
  - consecutive failures
  - no-progress attempts
  - last progress timestamp
- Added D-4 step metadata to normalized step rows:
  - attempt number / count
  - idempotency key
  - idempotency flag
  - declared side effects
  - failed timestamp
  - output hash
  - error type
  - reason
- Mirrored active lease state onto the normalized execution row during lock / attempt heartbeat writes.
- Preserved execution counters and lease fields across:
  - hydration
  - atomic attempt boundaries
  - atomic pause paths
  - atomic terminal finalization
- Enforced bounded runtime behavior in the live engine:
  - `maxConcurrentExecutions`
  - `maxExecutionDurationMs`
  - `maxStepDurationMs`
  - `maxExecutionAttempts`
  - `maxConsecutiveFailures`
  - `noProgressAttemptLimit`
- Tightened paused-for-review semantics so review-hold states release the active lease.
- Hardened live step execution so side-effecting steps without sufficient declaration / idempotency evidence pause for review before dispatch.
- Hardened live step execution so stale workers stop after lease loss instead of silently continuing.
- Tightened deterministic recovery:
  - partial started attempts without terminal evidence pause for operator recovery
  - unsafe side-effecting failed attempts route to operator recovery
  - snapshot / ledger mismatches are treated conservatively and can escalate to corruption
- Tightened operator action boundaries so invalid manual transitions fail closed.
- Strengthened transaction entry points to use `BEGIN IMMEDIATE` for top-level write transactions.
- Strengthened execution config validation for lease and attempt-limit invariants.

## D-4 Contract Audit

### Implemented

- Bounded execution duration: yes
- Bounded step duration: yes
- Bounded total attempts: yes
- Bounded consecutive failures: yes
- Bounded no-forward-progress retries: yes
- Concurrent execution cap: yes
- Lease renewal interval validated against lease duration: yes
- Paused-for-review releases the lease: yes
- Resume reacquires a fresh lease from an inactive baseline: yes
- Live execution stops after lease loss: yes
- Side-effecting work requires stronger approval / idempotency evidence: yes
- Atomic lifecycle boundaries used on the checkpointed execution path: yes
- Recovery prefers durable evidence over optimistic replay: yes
- Unsafe or ambiguous crash seams route to operator recovery or corruption: yes
- Operator/manual invalid transitions fail closed: yes

### Repo-Grounded State Note

This repository uses a grounded runtime state vocabulary that is slightly richer than the abstract D-4 prompt:

- `awaiting_review`
- `pause_for_operator_recovery`
- `execution_abandoned`
- `corrupted`

Those repo-grounded states are intentional and are now part of the stable containment model.

## Conservative Deviations

Phase 3.4D-4 intentionally chose stricter containment than the abstract phase wording in a few places:

- Side-effecting crash recovery is more conservative than auto-retry:
  - `network_call`
  - `external_write`
  - unsafe `local_write`
  now route to operator recovery instead of automatic replay
- Snapshot state that gets ahead of durable ledger/checkpoint evidence can escalate to `CORRUPTED` instead of a softer review pause
- Lease loss during a running step pauses for review instead of assuming success or failure semantics

These are intentional safety-biased choices, not incidental drift.

## Verification

### Focused

```powershell
npx vitest run --config vitest.config.mjs tests/unit/execution-checkpoint.test.ts tests/unit/staged-execution.test.ts tests/unit/runtime-control.test.ts
```

Result: `102 / 102`

### Broad

```powershell
npx vitest run --config vitest.config.mjs tests/unit/transaction.rollback.test.ts tests/unit/transaction.commit.test.ts tests/unit/transaction.shared-context.test.ts tests/unit/transaction.no-internal-tx.test.ts tests/unit/lifecycle.atomic-terminal.test.ts tests/unit/lifecycle.atomic-rollback.test.ts tests/unit/lifecycle.atomic-lock-release.test.ts tests/unit/lifecycle.attempt-atomic.test.ts tests/unit/execution-state-store.test.ts tests/unit/execution-integrity-store.test.ts tests/unit/staged-execution.test.ts tests/unit/execution-checkpoint.test.ts tests/unit/runtime-control.test.ts tests/unit/operator-recovery.test.ts
```

Result: `132 / 132`

## Status

Phase 3.4D-4 is complete for:

- bounded runtime containment
- lease-aware execution control
- deterministic crash recovery hardening
- live idempotency / side-effect gating
- operator transition hardening
- transaction-boundary enforcement at the storage edge

## Readiness For Next Phase

Yes. The project is ready for the next phase.

Reason:

- the D-2 persistence contract is intact
- the D-3 operator layer is intact
- the D-4 containment model is now enforced in live execution, recovery, operator action handling, and storage boundaries
- remaining work in this area is polish or follow-on specialization, not a blocking architectural gap

If a next phase depends on execution reliability, containment, or deterministic recovery, this is a stable base to build on.
