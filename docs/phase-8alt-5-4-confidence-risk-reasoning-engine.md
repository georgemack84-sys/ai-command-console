# Phase 8ALT.5.4 - Confidence & Risk Reasoning Engine

The Confidence & Risk Reasoning Engine explains why confidence and risk values were assigned to an autonomous decision. It derives all reasoning from certified `ExplanationRecord` fields and optional Evidence & Policy Reasoning Graph references, then emits deterministic assessments, lineage timelines, mitigation explanations, narratives, replay records, and validation artifacts.

## Implemented Scope

- Deterministic confidence assessments across evidence, planning, orchestration, delegation, supervision, governance, authority, replay, integrity, and overall decision confidence.
- Deterministic risk assessments across operational, execution, orchestration, delegation, supervision, governance, policy, constitutional, authority, integrity, replay, dependency, and recovery risk.
- Confidence and risk evolution timelines with stable ordering and hashes.
- Mitigation explanation records with selected and rejected mitigations, governance approval, authority approval, expected effectiveness, and residual risk.
- Operator-readable confidence and risk narratives.
- Fail-closed validation for incomplete evidence, missing confidence factors, unreproducible risk classification, missing governance or constitutional validation, incomplete authority validation, invalid replay, lineage gaps, undocumented mitigation, nondeterministic calculations, cross-tenant references, integrity failure, and advisory-only violations.

## API Surface

- `GET /api/confidence-risk-reasoning-engine/contract`
- `POST /api/confidence-risk-reasoning-engine/calculate-confidence`
- `POST /api/confidence-risk-reasoning-engine/analyze-risk`
- `POST /api/confidence-risk-reasoning-engine/confidence-narrative`
- `POST /api/confidence-risk-reasoning-engine/risk-narrative`
- `POST /api/confidence-risk-reasoning-engine/replay-confidence`
- `POST /api/confidence-risk-reasoning-engine/replay-risk`
- `POST /api/confidence-risk-reasoning-engine/validate`
- `GET|POST /api/confidence-risk-reasoning-engine/inspect`
