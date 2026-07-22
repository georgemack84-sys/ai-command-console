# Phase 8ALT.4.1 - Mission Health Contract

## Purpose

Phase 8ALT.4.1 establishes the canonical Mission Health model for Controlled Autonomy.

This phase defines the deterministic contract, schema, subsystem registry, scoring weights, confidence model, timeline model, trend model, evidence model, replay references, lineage references, and validation rules. It does not implement full subsystem publishers or autonomous actions.

## Implementation

- `types/mission-health-contract.ts` defines Mission Health records, subsystem records, confidence, timelines, trends, evidence, validation, replay, observability, and contract types.
- `services/mission-health-contract/index.ts` creates deterministic baseline mission health records, applies fixed weights, validates records, and replays records by hash.
- `app/api/mission-health-contract/*` exposes authenticated contract, health, validation, subsystem, evidence, timeline, trend, replay, and inspection routes.
- `tests/unit/mission-health-contract/missionHealthContract.test.ts` verifies registry weights, deterministic scoring, replay, evidence, timeline, trend, governance, advisory-only behavior, and fail-closed validation scenarios.

## Guarantees

- The subsystem registry is canonical and versioned.
- Weights are immutable within `mission-health-contract/v8ALT.4.1` and total exactly `1.0`.
- Mission health calculations are deterministic, replayable, explainable, tenant-isolated, governance-compliant, and advisory-only.
- Invalid subsystem registration, scores, confidence, aggregation, evidence, replay, lineage, integrity, and advisory-only behavior are rejected.

## Verification

Run:

```bash
npx vitest run tests/unit/mission-health-contract
npm run typecheck
```
