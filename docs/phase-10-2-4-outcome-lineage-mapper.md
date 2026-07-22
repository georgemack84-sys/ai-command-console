# Mission Control Phase 10.2.4 - Outcome Lineage Mapper

## Preview

Phase 10.2.4 adds the deterministic relationship graph that connects each normalized outcome to its complete historical chain: Decision, Recommendation, Decision Package, Operator Action, Execution, Observed Outcome, Truth Ledger, and Adaptive History.

## Tightened Contract

The mapper records relationships only. It does not alter decisions, recommendations, evidence, Truth Ledger records, or historical facts. Nodes, relationships, dependencies, query traversal, and replay metadata are deterministic, tenant-scoped, immutable, append-only, and versioned.

## Fail-Closed Validation

Certification blocks missing required chain nodes, invalid relationship types, orphan outcomes, cycles, cross-tenant lineage, mission mismatches, relationship registry append-only violations, lineage reordering, replay mismatch, hash mismatch, historical relationship mutation, invalid upstream binding, authorization failure, and fail-open behavior.

## Implementation

Implemented artifacts:

- `types/outcome-lineage-mapper.ts`
- `services/outcome-lineage-mapper/index.ts`
- `tests/unit/outcome-lineage-mapper/outcomeLineageMapper.test.ts`

The service composes `runTruthLedgerBindingEngine()`, builds standardized lineage nodes, relationship edges, historical dependency records, graph metadata, deterministic query output, replay reports, advisory-only metrics, and replay/hash helpers plus the phase foundation accessor.
