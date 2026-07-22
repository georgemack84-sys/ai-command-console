# Phase 10.10.7 - Proposal Lineage & Replay Binder

## Purpose

The Proposal Lineage & Replay Binder binds every adaptation proposal to immutable provenance and deterministic replay records.

It is the authoritative provenance layer for the Phase 10 adaptation proposal chain. It records lineage only and never changes proposal content, historical records, governance decisions, certification outcomes, or adaptive behavior.

## Tightened Contract

The implemented contract makes lineage binding a fail-closed, advisory-only provenance operation:

- Every bound proposal receives immutable artifact references, a dependency graph, a replay graph, traceability metadata, and reproducible integrity hashes.
- Backward traceability covers outcomes, recommendations, evidence, simulations, operator feedback, governance review, certification history, risk records, confidence records, scoring, prioritization, suppression, and consolidation.
- Forward traceability covers simulation execution, governance review, certification, operator review, rollback planning, and future proposal evolution.
- Replay graphs reconstruct proposal identity, inputs, evidence, analytical reasoning, governance, constitutional analysis, authority analysis, scoring, prioritization, suppression, and consolidation.
- The binder cannot mutate proposals, mutate history, rewrite lineage, approve, reject, implement, or change production behavior.

## API Surface

- `POST /proposal-lineage-replay-binder/bind`
- `POST /proposal-lineage-replay-binder/records`
- `POST /proposal-lineage-replay-binder/replay-graphs`
- `POST /proposal-lineage-replay-binder/dependency-graphs`
- `POST /proposal-lineage-replay-binder/metrics`
- `POST /proposal-lineage-replay-binder/replay`
- `POST /proposal-lineage-replay-binder/inspect`
- `GET /proposal-lineage-replay-binder/contract`

## Reference Categories

- `OUTCOME`
- `RECOMMENDATION`
- `EVIDENCE`
- `SIMULATION`
- `OPERATOR_FEEDBACK`
- `GOVERNANCE_REVIEW`
- `CERTIFICATION_HISTORY`
- `RISK_RECORD`
- `CONFIDENCE_RECORD`
- `SCORING`
- `PRIORITIZATION`
- `SUPPRESSION`
- `CONSOLIDATION`

## Failure Behavior

Binding fails closed for missing references, incomplete evidence lineage, replay graph generation failure, incomplete governance or certification history, integrity failure, inconsistent dependency graphs, nondeterministic replay, tenant isolation violations, cross-tenant lineage attempts, lineage rewrites, immutable record overwrites, dependency fabrication, and any attempted proposal approval, rejection, implementation, or mutation.

## Verification

The focused unit suite validates immutable lineage records, complete reference binding, dependency graphs, replay graphs, backward and forward traceability, observability metrics, advisory-only guarantees, fail-closed validation, and replay tamper detection.
