# Program 5 - Phase P5.6 Risk Modeling & Governance

P5.6 establishes canonical risk architecture for the CATA Trust Framework. It defines autonomy, governance, operational, mission, and trust risk semantics while keeping risk separate from trust, confidence, authority, and policy enforcement.

## Implemented Artifacts

- `types/trust-risk-governance.ts` defines risk taxonomy, risk model definitions, risk records, unified risk assessment, aggregation, governance, reporting, observability, validation, and certification contracts.
- `services/trust-risk-governance/index.ts` provides deterministic `runTrustRiskGovernance`, `validateTrustRiskGovernance`, `replayTrustRiskGovernance`, and `getTrustRiskGovernanceBundle` functions.
- `app/api/trust-risk-governance/*` exposes authenticated projections for model, registry, assessment, aggregation, governance/reporting, observability, validation, and readiness.
- `tests/unit/trust-risk-governance/trustRiskGovernance.test.ts` validates all five canonical risk domains, deterministic computation, evidence-backed explainability, lineage, governance integration, separation from trust/confidence/authority/policy, replay, and fail-closed controls.

## Constitutional Principle

Risk is advisory evidence for governance. It estimates potential negative outcomes and never represents trust, confidence, authority, or permission to execute.
