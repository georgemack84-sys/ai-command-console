# Phase 8ALT.5.2 - Decision Narrative Engine

The Decision Narrative Engine converts canonical `ExplanationRecord` data into deterministic, operator-readable narratives. It is template-driven, evidence-bound, replayable, tenant-isolated, immutable, and advisory-only.

## Implemented Scope

- Canonical `DecisionNarrative` and append-only `DecisionNarrativeRepository`.
- Deterministic narrative sections for objective, selected plan, rejected alternatives, execution sequence, governance decision, authority approval, confidence/risk, and intervention history.
- Complete metadata for narrative, explanation, decision, mission, execution, tenant, versions, replay, lineage, integrity, and source explanation references.
- Fail-closed validation for incomplete decisions, missing evidence, missing selected plans, undocumented rejected alternatives, governance/constitutional/authority gaps, unreproducible confidence/risk, invalid replay, nondeterministic wording, fabricated statements, cross-tenant evidence, integrity failure, and advisory-only violations.
- Authenticated APIs under `/api/decision-narrative-engine/*`.

## API Surface

- `GET /api/decision-narrative-engine/contract`
- `POST /api/decision-narrative-engine/generate`
- `POST /api/decision-narrative-engine/get`
- `POST /api/decision-narrative-engine/replay`
- `POST /api/decision-narrative-engine/validate`
- `GET|POST /api/decision-narrative-engine/inspect`
