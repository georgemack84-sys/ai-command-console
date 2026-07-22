# Phase 12.4 - Strategy Candidate Generation

Phase 12.4 establishes deterministic, advisory-only generation of bounded, evidence-linked, policy-compliant strategy candidates for each certified Recommendation Cycle. The implementation lives in `services/strategy-candidate-generation` and consumes the Phase 12.3 cycle boundary before producing candidate artifacts.

## Implemented Capabilities

- Canonical `StrategyArtifact` schema with deterministic identity, immutable origin, policy manifest reference, authority reference, evidence refs, governance refs, confidence, uncertainty, lifecycle state, and integrity hash.
- Candidate generation policy with supported strategy type matrix and constitutional, governance, authority, evidence, and policy prerequisites.
- Eligibility validation for scope, objectives, policy, evidence, authority, governance, constitutional rules, dependencies, assumptions, and resources.
- Deterministic duplicate detection with exact, semantic, structural, equivalent, conflicting, and unique outcomes.
- Candidate consolidation that preserves provenance, equivalence mappings, origins, evidence, assumptions, dependencies, policy references, and replay lineage.
- Qualification records for confidence, uncertainty, evidence completeness, governance readiness, operational feasibility, replay readiness, and rationale.
- Strategy artifact registry and candidate-set closure validator.
- Append-only candidate generation ledger, replay report, observability report, and certification suite.

## API Surface

- `GET /api/strategy-candidate-generation/contract`
- `GET|POST /api/strategy-candidate-generation/generate`
- `GET|POST /api/strategy-candidate-generation/eligibility`
- `GET|POST /api/strategy-candidate-generation/duplicates`
- `GET|POST /api/strategy-candidate-generation/consolidation`
- `GET|POST /api/strategy-candidate-generation/qualification`
- `GET|POST /api/strategy-candidate-generation/registry`
- `GET|POST /api/strategy-candidate-generation/closure`
- `GET|POST /api/strategy-candidate-generation/lineage`
- `GET|POST /api/strategy-candidate-generation/ledger`
- `GET|POST /api/strategy-candidate-generation/replay`
- `GET|POST /api/strategy-candidate-generation/certification`
- `POST /api/strategy-candidate-generation/validate`
- `GET|POST /api/strategy-candidate-generation/observability`

## Certification Gate

The certification suite passes only when every strategy is deterministic, evidence-linked, policy-bound, constitutionally compliant, governance-approved, advisory-only, tenant-isolated, lineage-preserving, duplicate-suppressed, consolidated without provenance loss, qualified before evaluation, registered, closed immutably, ledgered append-only, and replayable.
