# Phase 9.9.2 - Workflow State Machine

## Preview

Phase 9.9.2 implements the deterministic workflow lifecycle for operator decision workflows. It defines operational workflow states, legal transitions, transition events, append-only state history, validation, replay checks, history ledger entries, and observability.

## Tightened Contract

This phase validates and records workflow state progression only. It does not implement approval decisions, operator overrides, escalation processing, workflow dashboards, or action execution.

The state machine fails closed when transitions are skipped, invalid, unauthorized, duplicate, circular, hidden, terminally illegal, replay-divergent, governance-invalid, constitutionally invalid, tenant-mismatched, integrity-invalid, or advisory-only guarantees are violated.

## Implementation

- `types/workflow-state-machine.ts` defines operational states, transition events, state history, transition contract, validation, state history ledger, replay, observability, and foundation contracts.
- `services/workflow-state-machine/index.ts` implements legal transition rules, deterministic progression to `PRESENTED`, transition validation, append-only history, replay verification, fail-closed handling, observability, and foundation export.
- `tests/unit/workflow-state-machine/workflowStateMachine.test.ts` covers deterministic progression, legal transition contract, illegal/skipped/duplicate/hidden/circular/terminal transitions, governance/constitutional/replay/tenant/advisory/security boundaries, replay divergence, and integrity tampering.

## Certification Notes

This phase is ready for Phase 9.9 certification when focused tests, stack tests, broad decision sweeps, typecheck, and lint pass with only the repository's expected ignored-service-file warning.
