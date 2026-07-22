# Program 5 P5.6 Risk Modeling and Governance

P5.6 establishes the canonical CATA risk architecture. It owns autonomy, governance, operational, mission, and trust risk semantics while keeping risk explicitly separate from trust, confidence, authority, and policy.

## Canonical Scope

- Risk taxonomy for `AUTONOMY`, `GOVERNANCE`, `OPERATIONAL`, `MISSION`, and `TRUST`.
- Evidence-weighted risk model with deterministic impact, likelihood, and confidence-gap weighting.
- Risk registry containing tenant-scoped `RiskRecord` entries with score, level, disposition, contributing factors, evidence, confidence, trust, mitigation, lifecycle, and lineage references.
- Unified risk aggregation with duplicate elimination and evidence-lineage preservation.
- Explainable risk reports covering contributing factors, evidence references, weighting summaries, assumptions, and justification.
- Risk governance with governance review, operator review, approval routing, evidence validation, audit lineage, constitutional-control preservation, and separation from confidence and authority.
- Observability for lifecycle, replay, lineage, governance review, and operator review monitoring.

## Constitutional Rules

Risk is advisory evidence only. It may recommend monitoring, mitigation, operator review, or governance review, but it never grants authority, substitutes for trust, substitutes for confidence, or overrides constitutional policy.

## Qualification Behavior

The default outcome is `PASS`. Missing risk domains, non-deterministic computation, non-reproducible aggregation, missing explanations, incomplete lineage, mutable audit, tenant-isolation failure, or any conflation with trust, confidence, authority, or policy fails qualification. Operator-review and governance-review scenarios surface explicit review-required outcomes.

## Interfaces

- `GET /api/trust-risk-governance/contract`
- `POST /api/trust-risk-governance/validate`
- Section endpoints: `model`, `registry`, `assessment`, `aggregation`, `governance`, `observability`, and `readiness`
