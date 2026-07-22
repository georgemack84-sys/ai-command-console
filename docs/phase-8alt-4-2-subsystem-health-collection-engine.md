# Phase 8ALT.4.2 - Subsystem Health Collection Engine

## Purpose

Phase 8ALT.4.2 implements the deterministic subsystem health collection layer for Mission Health Intelligence.

The engine observes, validates, normalizes, and publishes standardized subsystem health records from the canonical Mission Health registry. It does not execute corrective actions, initiate recovery, mutate subsystem state, modify governance, or escalate authority.

## Implementation

- `types/subsystem-health-collection-engine.ts` defines collection states, health records, normalized metrics, stability metrics, alerts, anomalies, failures, evidence, validation, replay, observability, and contract types.
- `services/subsystem-health-collection-engine/index.ts` deterministically collects records for the eight certified subsystems, normalizes metrics, registers evidence, and validates replay/lineage/integrity.
- `app/api/subsystem-health-collection-engine/*` exposes authenticated contract, collect, records, normalized metrics, evidence, alerts, anomalies, failures, replay, validation, and inspection routes.
- `tests/unit/subsystem-health-collection-engine/subsystemHealthCollectionEngine.test.ts` verifies deterministic collection, normalization, evidence registration, replay, tenant isolation, governance/authority checks, observation-only behavior, and fail-closed scenarios.

## Guarantees

- Collection order is deterministic.
- Normalized metrics align with `mission-health-contract/v8ALT.4.1`.
- Evidence is immutable, traceable, replay-compatible, and integrity hashed.
- Invalid schemas, duplicate reports, missing evidence, invalid confidence, missing replay/lineage, integrity failure, authority failure, governance failure, cross-tenant reports, and advisory-only violations are rejected.

## Verification

Run:

```bash
npx vitest run tests/unit/subsystem-health-collection-engine
npm run typecheck
```
