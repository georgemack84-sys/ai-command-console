# Phase 12.5 - Scenario Intelligence

Phase 12.5 constructs deterministic, evidence-linked, governance-compliant scenarios for evaluating candidate strategies under explicitly defined conditions. The implementation lives in `services/scenario-intelligence` and consumes the certified Phase 12.4 candidate set as its source of cycle, strategy, evidence, and policy lineage.

## Implemented Capabilities

- Canonical immutable `ScenarioArtifact` schema with deterministic identity, candidate strategy refs, objective refs, temporal range, assumptions, variables, constraints, evidence refs, policy manifest ref, governance refs, origin, lifecycle, and integrity hash.
- Bounded scenario taxonomy for base, best, worst, expected, stress, adversarial, constraint, policy, resource, and temporal cases.
- Scenario construction policy with approved methods and prohibited nondeterministic or non-governed methods.
- Explicit assumption registry with evidence support, policy refs, governance approval, lifecycle, and replayable integrity.
- Coverage report for required classes, objective, strategy, constraint, temporal, governance, policy, and adversarial coverage.
- Deterministic scenario qualification for evidence sufficiency, policy compliance, governance eligibility, assumption validity, relevance, replay, integrity, and origin completeness.
- Scenario registry, closure certificate, append-only construction ledger, replay report, observability report, and certification suite.

## API Surface

- `GET /api/scenario-intelligence/contract`
- `GET|POST /api/scenario-intelligence/generate`
- `GET|POST /api/scenario-intelligence/taxonomy`
- `GET|POST /api/scenario-intelligence/assumptions`
- `GET|POST /api/scenario-intelligence/coverage`
- `GET|POST /api/scenario-intelligence/qualification`
- `GET|POST /api/scenario-intelligence/closure`
- `GET|POST /api/scenario-intelligence/registry`
- `GET|POST /api/scenario-intelligence/ledger`
- `GET|POST /api/scenario-intelligence/replay`
- `GET|POST /api/scenario-intelligence/certification`
- `POST /api/scenario-intelligence/validate`
- `GET|POST /api/scenario-intelligence/observability`

## Certification Gate

The certification suite passes only when scenario construction is deterministic, taxonomy is complete, assumptions are explicit and evidence-linked, coverage is complete, policy and governance are enforced, scenarios remain tenant-isolated and advisory-only, immutable lineage is preserved, replay is reproducible, and integrity validation succeeds.
