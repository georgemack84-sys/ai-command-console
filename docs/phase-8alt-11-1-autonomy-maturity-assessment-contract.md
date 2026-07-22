# Phase 8ALT.11.1 - Autonomy Maturity Assessment Contract

## Purpose

Phase 8ALT.11.1 establishes the deterministic Autonomy Maturity Assessment Contract used to describe autonomy maturity domains, maturity levels, scoring categories, lifecycle transitions, governance rules, constitutional rules, replay requirements, lineage requirements, and integrity requirements.

This phase is contract-only. It does not advance maturity, grant production certification, modify authority, modify governance, modify constitutional state, or influence execution behavior.

## Canonical Domains

The contract defines ten autonomy maturity domains:

- Constitutional Compliance
- Governance Compliance
- Authority Enforcement
- Planning Intelligence
- Execution Intelligence
- Replay Integrity
- Explainability
- Resilience
- Visibility
- Certification Readiness

## Maturity Levels

The maturity registry defines five ordered levels:

- Level 1: Assisted Execution
- Level 2: Guided Autonomy
- Level 3: Controlled Autonomy
- Level 4: Resilient Autonomy
- Level 5: Certified Constitutional Autonomy

Level definitions are descriptive assessment targets only. The contract never authorizes a level change.

## Deterministic Validation

The validation framework verifies:

- schema completeness
- defined maturity levels
- scoring rule consistency
- governance rule presence
- constitutional rule presence
- lifecycle completeness
- replay reference presence
- integrity hash presence
- deterministic transition ordering
- tenant isolation
- absence of hidden scoring logic
- advisory-only behavior

Failure scenarios are represented explicitly and reproducibly for certification coverage.

## API Surface

- `GET /api/autonomy-maturity-assessment-contract/contract`
- `POST /api/autonomy-maturity-assessment-contract/contract`
- `POST /api/autonomy-maturity-assessment-contract/domains`
- `POST /api/autonomy-maturity-assessment-contract/levels`
- `POST /api/autonomy-maturity-assessment-contract/schema`
- `POST /api/autonomy-maturity-assessment-contract/lifecycle`
- `POST /api/autonomy-maturity-assessment-contract/validate`
- `GET /api/autonomy-maturity-assessment-contract/inspect`
- `POST /api/autonomy-maturity-assessment-contract/inspect`

All endpoints require authenticated workspace membership and return deterministic read-only contract artifacts.
