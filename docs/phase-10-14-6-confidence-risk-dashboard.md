# Phase 10.14.6 - Confidence & Risk Dashboard

## Purpose

Phase 10.14.6 adds the shared read-only dashboard for confidence calibration and risk adaptation. It exposes confidence accuracy, drift, evidence reliability, risk severity, probability, actualization, governance-sensitive risk, adaptive proposal state, replay readiness, rollback readiness, and alerts without recalibrating confidence, mutating risk models, changing thresholds, approving proposals, bypassing simulation, or expanding authority.

## Implementation

- Types: `types/confidence-risk-dashboard.ts`
- Service: `services/confidence-risk-dashboard/index.ts`
- API: `app/api/confidence-risk-dashboard/*`
- Tests: `tests/unit/confidence-risk-dashboard/confidenceRiskDashboard.test.ts`

The service uses deterministic dashboard source records for confidence and risk so both domains remain separately inspectable. The comparison workspace explicitly rejects unsupported composite scoring and preserves separate confidence and risk scales.

## Governance

The dashboard is observational and advisory-only. API and result contracts disable creation, mutation, confidence recalibration, risk model mutation, threshold mutation, proposal approval, simulation bypass, rollback execution, and authority expansion.

Governance-sensitive risks remain visible and cannot be hidden by aggregation or downgraded solely through statistical confidence.

## Verification

Focused tests validate contract shape, deterministic rendering, confidence and risk section coverage, lineage references, governance-sensitive risk visibility, role and tenant controls, read-only behavior, observability, fail-closed scenarios, and nested tamper detection.
