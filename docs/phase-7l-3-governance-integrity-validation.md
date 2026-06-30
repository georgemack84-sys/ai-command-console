# Phase 7L.3 - Governance Integrity Validation

Phase 7L.3 adds the Governance Integrity Validation layer for the Mission Control certification suite. It validates the complete Governance Intelligence history across hash chains, evidence, recommendations, policies, replay records, governance history, tenant isolation, and authority boundaries.

## Runtime Contract

- Service: `services/governance-integrity-validation`
- Types: `types/governance-integrity-validation.ts`
- API base: `/api/governance-integrity-validation`
- Schema: `governance-integrity-validation/v7L.3`
- Phase: `7L.3`

The validator is read-only and advisory-only. It never repairs governance history, mutates certification evidence, executes governance actions, or bypasses integrity failures.

## Validation Domains

- `HASH_CHAIN`: validates hash reproducibility, parent references, certification hashes, and ledger continuity.
- `EVIDENCE`: validates evidence authenticity, completeness, lineage, and reference integrity.
- `RECOMMENDATION`: validates recommendation content and confidence immutability.
- `POLICY`: validates policy definition, hierarchy, precedence, and dependency integrity.
- `REPLAY`: validates replay records, replay evidence, replay outputs, and replay timelines.
- `HISTORY`: validates governance event ordering, completeness, and historical immutability.
- `TENANT`: validates tenant-scoped history and evidence isolation.
- `AUTHORITY`: validates read-only advisory authority boundaries.

## API Surfaces

- `GET /api/governance-integrity-validation/contract`
- `GET /api/governance-integrity-validation/report`
- `GET /api/governance-integrity-validation/run`
- `GET /api/governance-integrity-validation/checks`
- `GET /api/governance-integrity-validation/result`
- `GET /api/governance-integrity-validation/timeline`
- `GET /api/governance-integrity-validation/evidence`
- `GET /api/governance-integrity-validation/ledger`
- `GET /api/governance-integrity-validation/observability`
- `GET /api/governance-integrity-validation/hash`

Each endpoint supports optional `tenantId`, `missionId`, `validatorId`, and `scenario` query parameters.

## Failure Coverage

The scenario matrix covers broken hash chains, hash mismatches, missing hashes, orphaned records, missing or altered evidence, invalid evidence references, recommendation changes, confidence alteration, policy modification/deletion, replay alteration, missing replay evidence, deleted/modified/reordered history, incomplete timelines, tenant isolation violations, authority boundary bypasses, and hidden integrity state.

Any violation produces a failed validation result and a terminal failure state such as `HASH_FAILURE`, `EVIDENCE_FAILURE`, `POLICY_FAILURE`, `RECOMMENDATION_FAILURE`, `REPLAY_FAILURE`, `HISTORY_FAILURE`, or `CORRUPTION_DETECTED`.
