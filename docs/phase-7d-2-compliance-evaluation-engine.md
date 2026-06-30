# Phase 7D.2 - Compliance Evaluation Engine

## Purpose

Phase 7D.2 turns the static 7D.1 Compliance Contract into an active evaluation engine. It evaluates policy, constitutional, authority, and operational compliance with deterministic evidence, scoring, thresholds, decisions, ledger records, and replay snapshots.

## Deliverables

- Evaluation request, rule evaluation, evidence bundle, requirement matching, violation detection, measurement, scoring, threshold processing, evidence validation, decision, ledger, replay, validation, and observability types in `types/compliance-evaluation.ts`.
- Compliance evaluation doctrine, request builder, rule resolver, evidence collector, rule evaluator, requirement matcher, violation detector, measurement layer, scoring engine, threshold processor, evidence validator, decision engine, ledger writer, replay snapshot generator, validator, replay verifier, and observability surface in `services/compliance-evaluation/index.ts`.
- Authenticated API routes under `/api/compliance-evaluation/*`.
- Certification-readiness tests in `tests/unit/compliance-evaluation/complianceEvaluation.test.ts`.

## Pipeline

The engine executes the canonical 7D.2 pipeline:

1. Rules
2. Evidence collection
3. Requirement matching
4. Violation detection
5. Compliance measurement
6. Score generation
7. Evidence validation
8. Compliance decision
9. Ledger recording

Each stage emits a hashable output that can be inspected and replayed.

## Critical Overrides

The engine forces `CRITICAL` for constitutional violations, governance bypass, operator bypass, boundary breach, execution restriction violation, tampered evidence, ledger write failure, replay mismatch, cross-tenant evidence, and hidden state.

## Fail-Closed Rules

Missing rules, missing thresholds, missing evidence, invalid evidence, tampered evidence, tenant leakage, missing lineage, missing replay references, ledger write failures, score mismatches, threshold mismatches, decision mismatches, replay mismatches, and hidden state fail closed.

## Replay

Every evaluation includes a replay snapshot with rule snapshot, threshold snapshot, evidence bundle, requirement match result, violation result, score result, threshold result, decision version, final decision, Truth Ledger reference, and replay hash.

## Outcome

Mission Control can now continuously evaluate compliance behavior across governance policies, constitutional requirements, authority boundaries, and operational procedures, preparing Phase 7D.3 for trend analysis over these evaluation records.
