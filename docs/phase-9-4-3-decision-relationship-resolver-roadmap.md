# Phase 9.4.3 - Decision Relationship Resolver Roadmap

## Preview

Phase 9.4.3 resolves directed relationships between registered decision graph nodes. It turns explicit relationship hints into canonical relationship records, lineage records, ledger events, and updated node references while preserving deterministic replay.

## Tightened Scope

The resolver does not infer hidden relationships. It accepts registered graph nodes plus explicit relationship hints, validates them against the canonical Phase 9.4.1 registry, rejects unsafe combinations, removes exact duplicates, and records all relationship basis, governance, replay, confidence, evidence, and risk refs.

## Implementation

Implemented in `services/decision-graph/decisionRelationshipResolver.ts`.

Primary APIs:

- `resolveDecisionRelationships`
- `DecisionRelationshipResolver`

Resolved outputs:

- `DecisionRelationshipRecord`
- `DecisionRelationshipLineage`
- `DecisionRelationshipLedgerEvent`
- updated `DecisionGraphRoadmapNodeInput` snapshots
- deterministic replay hash

## Supported Relationships

- `depends_on`
- `blocks`
- `conflicts_with`
- `supersedes`
- `supports`
- `weakens`
- `escalates_to`
- `requires_operator_approval`
- `requires_governance_review`
- `requires_simulation`
- `requires_recovery_plan`
- `requires_certification`

## Fail-Closed Rules

The resolver rejects:

- unknown relationship types
- ambiguous directions
- missing source or target nodes
- self-dependencies
- self-supersession
- cross-tenant relationships
- cross-mission relationships
- missing governance refs
- missing replay refs
- hidden or implicit relationships
- invalid relationship combinations
- duplicate relationships with conflicting meaning
- replay divergence

## Determinism

Resolution uses sorted node and relationship traversal, stable rule priority, canonical duplicate keys, canonical serialization, and reproducible integrity hashes. Exact duplicate relationships are collapsed and recorded for replay.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\decisionRelationshipResolver.test.ts tests\unit\decision-graph\decisionGraphNodeBuilder.test.ts tests\unit\decision-graph\decisionGraphContractRoadmap.test.ts
```

Result: 3 files, 19 tests passed.
