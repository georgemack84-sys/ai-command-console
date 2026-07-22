# Mission Control Phase 9.3.8 - Historical Lineage & Replay Context Resolver

Phase 9.3.8 adds deterministic historical lineage and replay resolution for
`historical_context` and `replay_context` before orchestration.

## Scope

The resolver:

- resolves certified historical decisions related to a candidate;
- links previous outcomes, prior approvals, escalations, rejections, deferrals, and certifications;
- builds an immutable acyclic decision lineage graph;
- resolves candidate, upstream, historical, and certification replay references;
- verifies replay artifact availability, integrity, schema version, tenant boundary, and certification status;
- consumes Phase 9.3.1 through 9.3.7 context packages;
- fails closed for incomplete history, broken lineage, missing replay, cross-tenant lineage, or integrity failure.

## Public API

`createHistoricalReplayContextRequest(overrides?)`

Creates a replayable request containing the decision candidate, base context, mission and
tenant package, authority and operator package, evidence and dependency package, risk and
confidence package, governance and constitutional package, runtime/recovery/forecast package,
and resolver version.

`resolveHistoricalReplayContext(request?)`

Returns a `HistoricalReplayContextPackage` containing:

- `historical_context`
- `replay_context`
- `historical_domain`
- `replay_domain`
- `lineage_graph`
- validation status and failure reasons
- replay reference
- package integrity hash

`replayHistoricalReplayContext(package)`

Recomputes the package hash and reports whether historical and replay context can be
reconstructed exactly.

`buildHistoricalReplayObservability(packages)`

Aggregates resolution attempts, success and failure counts, historical failures, replay
failures, lineage failures, isolation failures, integrity failures, average history depth,
and replay success rate.

`getHistoricalReplayContextResolver()`

Returns resolver order, historical registry, outcome registry, certification registry, replay
artifact registry, default request, default package, replay result, and observability snapshot.

## Fail-Closed Conditions

The resolver reports `FAIL` when any of the following occur:

- historical registry or historical decisions are unavailable;
- previous outcomes or certification history cannot be linked;
- decision ancestry is incomplete;
- lineage graph contains a cycle;
- replay references are missing;
- replay artifacts are unavailable;
- replay integrity verification fails;
- lineage is incomplete;
- cross-tenant lineage is detected;
- integrity hashes cannot be reproduced.

## Context Contract Integration

Successful packages expose `historical_domain` and `replay_domain` values compatible with
`createDecisionContext({ domain_overrides })`, allowing Phase 9.3.1 decision contexts to be
patched with certified historical lineage and replay context before completeness and gap
analysis.
