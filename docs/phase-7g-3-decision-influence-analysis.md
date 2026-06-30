# Mission Control Phase 7G.3 - Decision Influence Analysis

## Delivered

Phase 7G.3 adds a deterministic Decision Influence Analysis Engine. It identifies, measures, orders, validates, replays, and explains the complete influence chain behind a governance conclusion.

## Contract Guarantees

- Every influence is represented as an immutable `DecisionInfluenceRecord`.
- Influence categories include constitution, authority, policy, compliance, risk, evidence, recommendation, and escalation.
- Relationship types include supported, required, constrained, influenced, validated, escalated, overridden, superseded, derived, dependent, and correlated relationships.
- Constitutional precedence is evaluated first and validated fail-closed.
- Contribution levels are deterministic: mandatory, primary, secondary, supporting, and informational.
- Influence graph, dependency graph, conflict resolution, contribution model, confidence model, and governance conclusion are replay-hashed.
- Validation covers DIA-001 through DIA-015.
- Hidden influences, circular dependencies, cross-tenant references, replay mismatches, unresolved conflicts, confidence mismatches, and immutable mutations are rejected.
- The surface remains advisory-only and does not mutate decisions or resolve conflicts autonomously.

## API Surface

- `GET /api/decision-influence-analysis/contract`
- `POST /api/decision-influence-analysis/analyze`
- `POST /api/decision-influence-analysis/graph`
- `POST /api/decision-influence-analysis/dependencies`
- `POST /api/decision-influence-analysis/conflicts`
- `POST /api/decision-influence-analysis/contributions`
- `POST /api/decision-influence-analysis/replay`
- `POST /api/decision-influence-analysis/explain`
- `POST /api/decision-influence-analysis/validate`
- `POST /api/decision-influence-analysis/hash`
- `GET|POST /api/decision-influence-analysis/inspect`

## Certification Readiness

The engine provides the deterministic influence model required by Phase 7G.4 Governance Explainability Engine and Phase 7G.5 Lineage Certification Gate.
