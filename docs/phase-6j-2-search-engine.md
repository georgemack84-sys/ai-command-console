# Mission Control Phase 6J.2 - Search Engine

Phase 6J.2 adds the controlled Truth Ledger Search Engine.

The engine performs deterministic recommendation, decision, and evidence lookup through the Phase 6J.1 Query Contract. It does not accept raw database access, does not mutate records, and does not decide governance policy by itself. It enforces contract validation, authority, governance outcomes, integrity state, redaction, replay metadata, deterministic ordering, and auditability before returning results.

## Implementation

- `services/mission-control/searchEngine.ts` implements controlled search over supplied index records.
- `services/mission-control/types.ts` defines search requests, filters, modes, views, index records, typed search results, response envelopes, replay metadata, and audit records.
- `services/mission-control/index.ts` exports the 6J.2 API.

## Supported Lookup Types

- `RECOMMENDATION_LOOKUP`
- `DECISION_LOOKUP`
- `EVIDENCE_LOOKUP`

Each result preserves its surrounding context: evidence, governance, replay, lineage, integrity, decision, recommendation, risk, and confidence references where applicable.

## Fail-Closed Controls

The engine blocks:

- missing or invalid Query Contracts
- unscoped or cross-tenant requests
- unsupported lookup types
- unauthorized lookup/view permissions
- governance-denied results
- corrupted records
- degraded records without integrity visibility
- restricted records without redaction
- nondeterministic ordering or pagination
- missing replay metadata for replay-required searches
- mutation attempts

## Determinism

Search results use explicit ordering and `truth_record_id` tie breakers. Responses include a query hash and result hash. Replay metadata includes filter hash, ordering hash, index version, schema version, and tokenizer version.

## Tests

`tests/unit/mission-control/searchEngine.test.ts` covers the roadmap matrix:

- valid recommendation, decision, and evidence lookup
- search without Query Contract
- missing tenant scope
- unsupported lookup type
- relationship refs returned for recommendation, decision, and evidence results
- unauthorized lookup paths
- cross-tenant blocking
- restricted evidence redaction enforcement
- corrupted and degraded integrity enforcement
- deterministic ordering
- replay-required metadata
- result hashing
- audit and replay metadata creation
- mutation blocking
