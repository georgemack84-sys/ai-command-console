# Phase 8C.1 - Execution Contract

## Purpose

The Execution Contract defines the canonical deterministic representation of a Mission Control execution instance before workflow orchestration begins. It binds execution identity, workflow identity, plan association, tenant ownership, mission metadata, operator approval, authority scope, governance references, checkpoints, rollback preparation, replay metadata, lifecycle state, and integrity hashing.

## Implemented Artifacts

- `types/execution-contract.ts` defines execution identity, workflow identity, plan association, tenant/operator/mission metadata, authority and governance references, dependency graph, checkpoints, rollback plan, constraints, timestamps, replay metadata, validation, state validation, replay, visibility, and aggregate framework contracts.
- `services/execution-contract/index.ts` implements deterministic identity generation, contract construction, integrity hashing, contract validation, state transition validation, replay, and visibility.
- `app/api/execution-contract/*` exposes authenticated framework, identity, contract, validate, state, replay, and visibility endpoints.
- `tests/unit/execution-contract/executionContract.test.ts` covers baseline contract creation, deterministic identities, integrity, validation failures, state transition failures, replay, visibility, and framework publication.

## Lifecycle Enforcement

Allowed transitions are defined for `CREATED`, `VALIDATED`, `REGISTERED`, `READY`, `RUNNING`, `WAITING`, `PAUSED`, `COMPLETED`, `FAILED`, `ROLLED_BACK`, and `ARCHIVED`. Illegal transitions, skipped stages, duplicates, invalid rollback state, governance gaps, authority gaps, replay gaps, and integrity mismatch are rejected.

## Orchestration Boundary

This phase does not start execution. It produces the validated, replayable contract required by Phase 8C.2 Workflow Orchestrator.
