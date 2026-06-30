# Mission Control Phase 6J.1 - Query Contract

Phase 6J.1 defines the standard contract for all Truth Ledger reads.

The contract makes read access explicit, tenant-scoped, governance-controlled, authority-verified, integrity-aware, replay-compatible, deterministic, redaction-aware, and audit-ready.

## Implementation

- `services/mission-control/queryContract.ts` defines the query type registry, requester registry, requested view registry, deterministic contract validator, query hash generation, result hash generation, and audit metadata projection.
- `services/mission-control/types.ts` defines the query contract schema, scope model, authority context, governance context, integrity requirements, replay requirements, redaction policy, pagination policy, ordering policy, lifecycle states, result states, validation context, validation result, and audit metadata.
- `services/mission-control/index.ts` exports the 6J.1 query contract API.

## Validation Rules

The validator rejects contracts that are:

- missing tenant scope
- using an unknown requester or query type
- missing requested records or views
- missing or unverified authority context
- missing or unevaluated governance context
- below the declared minimum integrity state
- decision-relevant but not replayable
- requesting restricted fields without redaction
- nondeterministically ordered
- missing deterministic pagination
- expired
- missing a query reason
- attempting mutation

## Contract Boundaries

6J.1 does not execute ledger queries and does not implement indexing, search, caching, retrieval, dashboards, external API gateways, or mutation behavior.

It only defines and validates the controlled read contract that later 6J phases will use.

## Tests

`tests/unit/mission-control/queryContract.test.ts` covers the roadmap matrix:

- valid tenant-scoped query
- missing tenant scope
- unknown query type
- authorized and unauthorized record lookup
- cross-tenant blocked and authorized paths
- missing governance or authority context
- deterministic and nondeterministic ordering
- replay-required query validation
- integrity-valid and integrity-corrupted paths
- redaction-required paths
- expired query contracts
- missing query reasons
- mutation attempts
- query and result hash generation
