# Mission Control Phase 7C.1 - Governance Risk Contract

## Purpose

Phase 7C.1 defines the canonical contract for Governance Risk Intelligence. It does not perform pattern detection, weakness analysis, scoring, remediation, approval, containment, or enforcement.

Every governance risk record is structured, deterministic, tenant-scoped, evidence-backed, lineage-aware, replay-ready, certification-ready, and operator-visible.

## Contract

The canonical record is `GovernanceRiskRecord`, defined in `types/governance-risk.ts`.

Required fields include:

- `governance_risk_id`
- `tenant_id`
- `mission_id`
- `governance_intelligence_id`
- `policy_intelligence_id`
- `risk_source_refs`
- `risk_category`
- `risk_severity`
- `severity_basis`
- `confidence_score`
- `confidence_basis`
- evidence, violation, policy, exception, escalation, lineage, and replay refs
- `risk_detected_timestamp`
- `risk_window`
- `risk_state`
- `explanation`
- `recommended_operator_review`
- `replay_package`
- `risk_hash`

## Validation

The validator fails closed for missing required fields, unknown risk sources, invalid categories, invalid severities, missing severity basis, missing confidence basis, missing evidence, missing lineage, missing replay inputs, cross-tenant references, invalid lifecycle states, identity mutation, missing explanations, and unsupported schema versions.

## API Surface

Phase 7C.1 exposes:

- `GET /api/governance-risk/contract`
- `POST /api/governance-risk/validate`
- `POST /api/governance-risk/hash`
- `POST /api/governance-risk/transition`
- `POST /api/governance-risk/replay`
- `GET|POST /api/governance-risk/inspect`

All routes require an authenticated workspace member.
