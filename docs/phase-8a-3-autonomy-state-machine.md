# Phase 8A.3 - Autonomy State Machine

## Purpose

The Autonomy State Machine manages deterministic lifecycle state for Controlled Autonomy instances. It prevents unknown states, skipped transitions, circular transitions, hidden state, undefined lifecycle behavior, ungoverned state changes, unreplayable transitions, and invisible operator-facing lifecycle mutation.

## Implemented Artifacts

- `types/autonomy-state-machine.ts` defines operational states, transition requests, transition records, validation results, transition ledgers, replay results, visibility surfaces, and the official state model.
- `services/autonomy-state-machine/index.ts` implements deterministic transition validation, state advancement, governance enforcement, recovery checks, immutable transition ledgers, replay reconstruction, and operator visibility.
- `app/api/autonomy-state-machine/*` exposes authenticated machine, model, initialize, transition, validate, ledger, replay, and visibility endpoints.
- `tests/unit/autonomy-state-machine/autonomyStateMachine.test.ts` verifies lifecycle model, valid transitions, invalid transition rejection, terminal reactivation blocking, recovery paths, ledger creation, replay, integrity mismatch detection, and visibility.

## State Model

Official states are `CREATED`, `INITIALIZED`, `VALIDATED`, `READY`, `MONITORING`, `ACTIVE`, `LIMITED`, `PAUSED`, `SUSPENDED`, `RESUMING`, `RETIRED`, and `ARCHIVED`.

The state engine supports governed branches into `LIMITED`, `PAUSED`, `SUSPENDED`, and `RETIRED`, and deterministic recovery through `RESUMING`. Terminal states cannot reactivate.

## Transition Guarantees

Every transition records autonomy identity, tenant, mission, previous state, next state, reason, triggering event, governance profile, authority scope, operator reference, replay reference, integrity hash, timestamp, validation state, and ledger status.

Validation rejects unknown states, hidden state, skipped or illegal transitions, circular transitions, terminal reactivation, missing governance, authority escalation, tenant mismatch, missing replay references, missing operator visibility, missing recovery approval, missing recovery replay validation, and governance-forced override attempts.

## Replay And Visibility

The transition ledger preserves immutable lifecycle history and replay references. Replay reconstructs state sequence, transition order, reasons, governance inputs, authority checks, operator interventions, integrity hashes, timestamps, and lifecycle outcome. The visibility surface exposes current state, previous state, eligible next states, blocked transitions, governance influence, authority status, replay reference, lifecycle history, integrity status, and recovery status.
