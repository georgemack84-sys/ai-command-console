# Phase 10.7.3 - Risk Drift Detector

## Tightened Implementation Contract

The Risk Drift Detector analyzes historical risk actualization trends across missions to detect persistent, directional, or systematic changes in risk prediction quality. It observes drift only. It never changes production risk models, thresholds, governance policy, constitutional safeguards, evidence, mission history, or operator authority.

## Implemented Scope

- Deterministic `RiskDriftRecord` for severity, probability, escalation, governance, mission-type, operator-specific, tenant-specific, domain, environmental, and composite prediction drift.
- Standard classifications: `IMPROVING`, `STABLE`, `MINOR_DRIFT`, `MODERATE_DRIFT`, `SIGNIFICANT_DRIFT`, `CRITICAL_DRIFT`, `GOVERNANCE_SENSITIVE_DRIFT`, `CONSTITUTIONAL_DRIFT`, `TENANT_SPECIFIC_DRIFT`, and `DOMAIN_SPECIFIC_DRIFT`.
- Trend analysis, confidence interval, drift timeline, evidence registry, ledger, validation, and replay support.
- False-positive mitigation through evidence sufficiency, trend confirmation, multi-mission validation, replay verification, and confidence threshold validation.
- API endpoints for contract, analysis, records, trends, confidence, timeline, evidence, ledger, severity, probability, escalation, governance, mission, operator, tenant, domain, validation, replay, and inspection.

## Deterministic Rules

- Identical historical inputs produce identical drift scores, trends, confidence intervals, timelines, evidence, ledger entries, replay hashes, and integrity hashes.
- Missing history, evidence, replay, governance, constitutional, lineage, statistical consistency, confidence threshold, or multi-mission validation fails closed.
- Tenant contamination, replay divergence, tampering, production mutation, evidence rewrite, mission history rewrite, governance rewrite, constitutional suppression, operator override, nondeterminism, and fail-open behavior fail validation.

## Advisory Boundary

Certified drift analyses set `advisory_only: true`, `observational_only: true`, `updates_risk_model: false`, `updates_risk_thresholds: false`, `changes_governance_policy: false`, and `changes_constitutional_safeguards: false`.
