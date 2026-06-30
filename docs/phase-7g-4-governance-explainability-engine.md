# Mission Control Phase 7G.4 - Governance Explainability Engine

## Delivered

Phase 7G.4 adds a deterministic Governance Explainability Engine that assembles verified governance lineage, policy lineage reconstruction, decision influence analysis, and truth/replay references into reproducible explanations.

## Contract Guarantees

- Explanations are assembled only from verified governance artifacts.
- Each explanation includes executive summary, detailed reasoning, and technical trace layers.
- Operator-facing views include executive, governance, audit, and technical surfaces.
- Required question surfaces explain recommendations, decisions, policy influence, risk contribution, and escalation.
- Replay hashes cover explanation text, summary, reasoning, references, formatting, and ordering.
- Validation covers `GEE-001` through `GEE-015`.
- Hidden reasoning, unsupported inference, cross-tenant references, replay mismatches, and immutable mutation are rejected fail-closed.

## API Surface

- `GET /api/governance-explainability/contract`
- `POST /api/governance-explainability/generate`
- `POST /api/governance-explainability/recommendation`
- `POST /api/governance-explainability/decision`
- `POST /api/governance-explainability/policy`
- `POST /api/governance-explainability/risk`
- `POST /api/governance-explainability/escalation`
- `POST /api/governance-explainability/replay`
- `POST /api/governance-explainability/validate`
- `POST /api/governance-explainability/hash`
- `GET|POST /api/governance-explainability/inspect`

## Certification Readiness

The engine provides the deterministic explanation surface required by Phase 7G.5 Lineage Certification Gate.
