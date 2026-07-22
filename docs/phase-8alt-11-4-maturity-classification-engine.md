# Phase 8ALT.11.4 - Maturity Classification Engine

## Purpose

Phase 8ALT.11.4 converts deterministic maturity scoring results into a reproducible maturity classification. It consumes Phase 8ALT.11.3 scoring output and applies immutable classification thresholds, transition evaluation, promotion eligibility, regression advisory status, explainability, replay references, lineage references, and integrity verification.

Promotion and regression outputs are advisory decision records only. This engine does not authorize maturity advancement, certification approval, governance changes, authority changes, or execution behavior changes.

## Levels

- Level 1: Assisted Execution
- Level 2: Guided Autonomy
- Level 3: Controlled Autonomy
- Level 4: Resilient Autonomy
- Level 5: Certified Constitutional Autonomy

Runtime assurance remains represented by Execution Intelligence, Resilience, and Visibility scoring from earlier phases.

## Validation

Validation verifies:

- defined thresholds
- consistent rules
- no unauthorized promotion
- regression trigger detection
- governance validation
- constitutional validation
- authority enforcement
- replay reconstruction
- integrity verification
- hidden logic prevention
- deterministic level assignment
- tenant isolation
- advisory-only behavior

## API Surface

- `GET /api/maturity-classification-engine/classify`
- `POST /api/maturity-classification-engine/classify`
- `POST /api/maturity-classification-engine/rules`
- `POST /api/maturity-classification-engine/transitions`
- `POST /api/maturity-classification-engine/ledger`
- `POST /api/maturity-classification-engine/validate`
- `GET /api/maturity-classification-engine/inspect`
- `POST /api/maturity-classification-engine/inspect`
