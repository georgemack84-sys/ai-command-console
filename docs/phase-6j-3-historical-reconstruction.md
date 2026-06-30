# Mission Control Phase 6J.3 - Historical Reconstruction Queries

Phase 6J.3 adds the controlled historical reconstruction layer for the Truth Ledger.

It answers time-bounded questions such as what Mission Control knew, recorded, verified, governed, decided, recommended, or evidenced at a specific historical moment. It is not replay execution and it does not infer missing history. It reconstructs only what the ledger and historical index can prove.

## Implementation

- `services/mission-control/historicalReconstruction.ts` implements contract-bound reconstruction, temporal anchor handling, late-arriving record policy, deterministic timelines, gap and conflict detection, governance redaction, integrity blocking, replay metadata, and audit records.
- `services/mission-control/types.ts` defines historical reconstruction queries, temporal anchors, target/context requests, historical index records, record states, timeline events, gaps, responses, replay metadata, and audit records.
- `services/mission-control/index.ts` exports the 6J.3 API.

## Temporal Anchors

Supported anchors:

- `KNOWN_AS_OF`
- `RECORDED_AS_OF`
- `OCCURRED_AS_OF`
- `EFFECTIVE_AS_OF`
- `VERIFIED_AS_OF`
- `BETWEEN_TIMES`

`KNOWN_AS_OF` excludes records that occurred before the anchor but were recorded after it, unless `include_late_arriving_records` is true. Included late-arriving records are explicitly flagged.

## Fail-Closed Controls

The engine blocks:

- missing Query Contracts
- missing tenant scope
- missing or invalid temporal anchors
- invalid between-time windows
- unauthorized historical reconstruction
- cross-tenant reconstruction
- restricted records without redaction policy
- corrupted hash chains
- nondeterministic ordering
- missing replay metadata
- mutation attempts

## Gaps and Conflicts

The engine detects:

- missing evidence
- broken lineage
- broken hash chains
- unverified or degraded records
- late-arriving records
- conflicting historical records
- redacted dependencies

## Tests

`tests/unit/mission-control/historicalReconstruction.test.ts` covers the roadmap matrix:

- as-of record state
- decision, recommendation, evidence, and timeline reconstruction
- between-time diff
- missing contract, tenant scope, temporal anchor, and valid window failures
- unauthorized and cross-tenant blocking
- restricted raw and redacted historical records
- late-arriving evidence exclusion and flagging
- supersession before and after anchor
- relationship refs in decision, recommendation, and evidence history
- missing evidence and broken lineage gaps
- corrupted hash chain blocking
- degraded integrity warnings
- deterministic ordering
- deterministic reconstruction hash
- replay metadata and audit records
- mutation blocking
