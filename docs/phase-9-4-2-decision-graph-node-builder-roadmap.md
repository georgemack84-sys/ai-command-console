# Phase 9.4.2 - Decision Graph Node Builder Roadmap

## Preview

Phase 9.4.2 bridges Phase 9.2 normalized decision intake into the Phase 9.4 graph model. It converts each valid `DecisionCandidate` into exactly one deterministic graph node that is ready for relationship resolution.

## Tightened Scope

The builder accepts only normalized `DecisionCandidate` records, validates required candidate fields, verifies candidate integrity, enforces tenant and mission scope, maps candidate metadata into graph node fields, attaches governance and replay references, and computes a reproducible node integrity hash.

The default initial graph state is `REGISTERED`. Callers may explicitly queue relationship resolution to start at `RELATIONSHIPS_PENDING`.

## Implementation

Implemented in `services/decision-graph/decisionGraphNodeBuilder.ts`.

Primary APIs:

- `buildDecisionGraphNodeFromCandidate`
- `generateDecisionGraphNodeId`
- `DecisionGraphNodeBuilder`

Builder outputs:

- canonical `DecisionGraphRoadmapNodeInput`
- `DecisionGraphNodeRecord`
- append-only audit records
- deterministic replay reference
- fail-closed certification status

## Determinism

`node_id` is derived only from:

- `tenant_id`
- `mission_id`
- `decision_candidate_id`
- `decision_type`
- `source_record_ref`
- `normalized_version`
- `graph_contract_version`

The builder rejects caller-supplied node IDs and hidden runtime context.

## Fail-Closed Rules

The builder rejects:

- missing or malformed candidates
- missing governance references
- missing replay references
- missing or mismatched candidate hashes
- tenant or mission mismatch
- duplicate node IDs
- cross-tenant node collisions
- node integrity hash mismatch
- advisory-only violations
- hidden runtime context
- random or caller-supplied node IDs

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\decisionGraphNodeBuilder.test.ts tests\unit\decision-graph\decisionGraphContractRoadmap.test.ts
```

Result: 2 files, 13 tests passed.
