# Phase 10.3.8 - Improvement Opportunity Generator

## Preview

The Improvement Opportunity Generator converts recommendation evaluation results into deterministic, evidence-backed proposals for future review. It is the handoff layer between recommendation effectiveness analysis and later adaptive intelligence, but it performs no adaptation itself.

## Tightened Contract

This phase provides an advisory-only opportunity registry that:

- derives improvement opportunities from validated recommendation dimension evaluations;
- classifies each opportunity by evidence, confidence, explainability, risk, governance, workflow, or decision-package category;
- estimates expected benefit and implementation complexity deterministically;
- requires governance approval for every opportunity by default;
- records append-only Truth Ledger bindings with evidence, governance, lineage, replay, and source evaluation references;
- validates tenant isolation, replay consistency, integrity, evidence completeness, governance readiness, and ledger immutability;
- exposes replayable API endpoints without update, delete, learning, or recommendation-modification behavior.

## Non-Goals

- No automatic recommendation changes.
- No model tuning, learning, or hidden optimization.
- No bypass of operator, governance, constitutional, authority, replay, or ledger controls.
- No certification when evidence, evaluation, governance, replay, lineage, tenant isolation, or integrity checks fail.

## Implemented Surface

- `GET /improvement-opportunity-generator/contract`
- `POST /improvement-opportunity-generator/generate`
- `POST /improvement-opportunity-generator/registry`
- `POST /improvement-opportunity-generator/classify`
- `POST /improvement-opportunity-generator/benefit`
- `POST /improvement-opportunity-generator/governance`
- `POST /improvement-opportunity-generator/validate`
- `POST /improvement-opportunity-generator/replay`
- `POST /improvement-opportunity-generator/inspect`

## Exit Criteria

Phase 10.3.8 is complete when opportunities are deterministic, replayable, evidence-backed, append-only, governance-controlled, advisory-only, tenant-isolated, cryptographically verifiable, and ready to feed Phase 10.3.9 without changing recommendation behavior.
