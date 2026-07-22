# Mission Control Phase 9.3.6 - Governance & Constitutional Context Resolver

Phase 9.3.6 adds the deterministic resolver for `governance_context` and
`constitutional_context` before orchestration.

## Scope

The resolver:

- resolves active governance policies from a scoped policy registry;
- evaluates applicable rules, approvals, reviews, and policy conflicts;
- preserves policy conflicts as explicit records and fails only unresolved conflicts;
- resolves immutable constitutional principles and execution constraints;
- evaluates constitutional compliance, violations, lineage, replay, and tenant isolation;
- consumes the Phase 9.3.1 through 9.3.5 context packages;
- fails closed when governance or constitutional context is incomplete or contaminated.

## Public API

`createGovernanceConstitutionalContextRequest(overrides?)`

Creates a replayable request containing the decision candidate, base context, mission and
tenant package, authority and operator package, evidence and dependency package, risk and
confidence package, and resolver version.

`resolveGovernanceConstitutionalContext(request?)`

Returns a `GovernanceConstitutionalContextPackage` containing:

- `governance_context`
- `constitutional_context`
- `governance_domain`
- `constitutional_domain`
- validation status and failure reasons
- replay reference
- package integrity hash

`replayGovernanceConstitutionalContext(package)`

Recomputes the package hash and reports whether the governance and constitutional context
can be replayed exactly.

`buildGovernanceConstitutionalObservability(packages)`

Aggregates resolution attempts, success and failure counts, governance failures,
constitutional failures, isolation failures, integrity failures, policy conflict count,
constitutional violation count, and replay success rate.

`getGovernanceConstitutionalContextResolver()`

Returns resolver order, policy registry, constitution registry, default request, default
package, replay result, and observability snapshot.

## Fail-Closed Conditions

The resolver reports `FAIL` when any of the following occur:

- policy repository or applicable policies are unavailable;
- governance evaluations, status, approvals, or reviews cannot be resolved;
- policy conflicts remain unresolved;
- constitutional principles or evaluations are unavailable;
- constitutional compliance cannot be determined;
- constitutional constraints are unenforced;
- constitutional violations are detected;
- lineage is incomplete;
- upstream replay is incompatible;
- cross-tenant governance references are detected;
- upstream integrity validation fails.

## Context Contract Integration

Successful packages expose `governance_domain` and `constitutional_domain` values compatible
with `createDecisionContext({ domain_overrides })`, allowing Phase 9.3.1 decision contexts to
be patched with certified governance and constitutional context before downstream phases.
