# Mission Control Phase 6J.4 - Cross-Ledger Correlation Queries

Phase 6J.4 adds governed cross-ledger relationship reconstruction.

It builds deterministic node-and-edge graphs across logical ledgers such as recommendation, decision, evidence, governance, replay, integrity, certification, lineage, audit, event, and truth ledgers. Every correlation remains bound to a valid 6J.1 Query Contract and cannot bypass tenant scope, authority, governance, integrity, replay, redaction, or audit controls.

## Implementation

- `services/mission-control/crossLedgerCorrelation.ts` implements contract-bound graph correlation, ledger validation, permission checks, traversal limits, cycle detection, relationship classification, strength handling, gap/conflict detection, redaction placeholders, temporal filtering, replay metadata, and audit records.
- `services/mission-control/types.ts` defines ledger registries, correlation query schema, seed records, correlation basis, relationship types, traversal and temporal policies, visibility states, nodes, edges, gaps, conflicts, ledger manifests, responses, replay metadata, and audit records.
- `services/mission-control/index.ts` exports the 6J.4 API.

## Controls

The engine fails closed for:

- missing or invalid Query Contracts
- missing tenant scope
- invalid source or target ledgers
- missing seed records
- unsupported correlation types
- unauthorized source or target ledgers
- cross-tenant correlation
- restricted nodes or edges without redaction or disclosure policy
- candidate edges used as certification proof
- corrupted source or target records
- broken references, missing evidence, and broken lineage
- nondeterministic graph ordering
- mutation attempts

## Relationship Semantics

Direct references and verified lineage/replay/evidence/integrity relationships can be marked verified. Temporal overlap alone is always candidate-level and cannot be treated as proof of causality. Candidate correlations can support investigation but cannot support certification.

## Tests

`tests/unit/mission-control/crossLedgerCorrelation.test.ts` covers the roadmap matrix:

- recommendation, decision, evidence, governance, replay, integrity, and certification correlations
- missing contract, tenant scope, ledger, seed, and type failures
- source and target authority failures
- cross-tenant blocking
- restricted node and edge handling
- redacted placeholders and disclosure denial
- verified, candidate, temporal, conflicting, and certification-unsafe edges
- corrupted and degraded integrity behavior
- gaps, missing evidence, conflicts, broken lineage, depth, and cycle controls
- deterministic node and edge ordering
- historical exclusion of future evidence and late-arriving warnings
- correlation hash, replay metadata, audit records, and mutation blocking
