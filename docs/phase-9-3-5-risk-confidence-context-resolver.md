# Mission Control Phase 9.3.5 - Risk & Confidence Context Resolver

Phase 9.3.5 adds a deterministic resolver for the `risk_context` and `confidence_context`
domains introduced by the Phase 9.3.1 decision context contract.

## Scope

The resolver:

- resolves active, residual, emerging, and mitigated risks for a decision candidate;
- verifies mitigation status, severity, exposure, lineage, replay references, and tenant scope;
- derives confidence from evidence quality, dependency state, replay compatibility, risk exposure, and validation results;
- records deterministic calibration adjustments and uncertainty factors;
- fails closed when required risk or confidence inputs are missing, unresolved, cross-tenant, or integrity-compromised.

## Public API

`createRiskConfidenceContextRequest(overrides?)`

Creates a replayable request with normalized candidate input, mission and tenant context,
authority and operator context, evidence and dependency context, and resolver metadata.

`resolveRiskConfidenceContext(request?)`

Returns a `RiskConfidenceContextPackage` containing:

- `risk_context`
- `confidence_context`
- `risk_domain`
- `confidence_domain`
- validation status and failure reasons
- replay reference
- package integrity hash

`replayRiskConfidenceContext(package)`

Recomputes the package hash and reports whether the package is replay-valid.

`buildRiskConfidenceObservability(packages)`

Aggregates resolution attempts, successes, failures, failure classes, average risk exposure,
average calibrated confidence, and replay success rate.

`getRiskConfidenceContextResolver()`

Returns the resolver order, bundled registry, default request, default package, replay result,
and observability snapshot for certification and SDK exposure.

## Fail-Closed Conditions

The resolver reports `FAIL` when any of the following occur:

- no active risks can be resolved;
- risk evidence is unavailable;
- severity or exposure cannot be reproduced;
- mitigation status is unknown;
- confidence sources are incomplete;
- calibration or uncertainty inputs are unavailable;
- historical lineage is missing;
- upstream replay is incompatible;
- a risk reference crosses tenant boundaries;
- upstream mission, tenant, authority, or operator context fails integrity validation.

## Context Contract Integration

Successful packages expose `risk_domain` and `confidence_domain` values compatible with
`createDecisionContext({ domain_overrides })`, allowing Phase 9.3.1 contexts to be patched
with deterministic risk and confidence records while preserving context validation.
