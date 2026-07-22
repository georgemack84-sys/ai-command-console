# Phase 10.10.10 - Proposal Explainability Engine

## Purpose

The Proposal Explainability Engine produces deterministic, evidence-backed, replayable explanations for adaptation proposals.

It explains proposals only. It never changes proposal content, mutates scores, hides evidence, changes governance decisions, approves proposals, authorizes implementation, or changes production behavior.

## Tightened Contract

- Every explanation is assembled from immutable lifecycle, ledger, lineage, replay, governance, and evidence references.
- Every explanation contains generation rationale, evidence used, patterns detected, feedback considered, expected improvements, expected risks, governance effects, constitutional effects, authority effects, operator effects, simulation requirements, certification requirements, and rollback requirements.
- Explanations are deterministic, machine-verifiable, human-readable, evidence-backed, traceable, reproducible, governance-aware, constitutionally compliant, and replayable.
- `can_advance_to_approval` is true only when the explanation is complete.
- Incomplete explanations fail closed and block progression.

## API Surface

- `POST /proposal-explainability-engine/explain`
- `POST /proposal-explainability-engine/explanations`
- `POST /proposal-explainability-engine/components`
- `POST /proposal-explainability-engine/metrics`
- `POST /proposal-explainability-engine/replay`
- `POST /proposal-explainability-engine/inspect`
- `GET /proposal-explainability-engine/contract`

## Explanation Components

- `GENERATION_RATIONALE`
- `EVIDENCE_USED`
- `PATTERNS_DETECTED`
- `FEEDBACK_CONSIDERED`
- `EXPECTED_IMPROVEMENTS`
- `EXPECTED_RISKS`
- `GOVERNANCE_EFFECTS`
- `CONSTITUTIONAL_EFFECTS`
- `AUTHORITY_EFFECTS`
- `OPERATOR_EFFECTS`
- `SIMULATION_REQUIREMENTS`
- `CERTIFICATION_REQUIREMENTS`
- `ROLLBACK_REQUIREMENTS`

## Failure Behavior

Explanation generation fails closed for proposal validation failures, incomplete evidence, missing replay references, unavailable governance, constitutional, authority, operator, simulation, certification, or rollback analysis, unexplained impacts, incomplete explanations, integrity failure, nondeterministic explanation generation, tenant isolation violations, fabricated reasoning, omitted evidence, hidden impacts, proposal mutation attempts, score mutation attempts, approval attempts, and implementation authorization attempts.

## Verification

The focused unit suite validates deterministic generation, component completeness, evidence and replay attribution, governance/constitutional/authority/operator/simulation/certification/rollback explanations, metrics, advisory-only guarantees, fail-closed behavior, approval gating, and replay tamper detection.
