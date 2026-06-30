# Phase 7D.4 - Compliance Confidence Engine

## Purpose

Phase 7D.4 determines how reliable Mission Control compliance findings, evidence, and compliance-related recommendations are. Confidence qualifies compliance decisions without replacing them.

## Deliverables

- Confidence type registry, confidence factor assessments, confidence inputs, lineage, ledger, replay, validation, and operator visibility types in `types/compliance-confidence.ts`.
- Confidence doctrine, input collector, evidence confidence evaluator, rule coverage evaluator, consistency evaluator, authority verifier, lineage checker, replay checker, historical stability evaluator, deterministic confidence calculator, ledger writer, replay validator, validator, and observability surface in `services/compliance-confidence/index.ts`.
- Authenticated API routes under `/api/compliance-confidence/*`.
- Certification-readiness tests in `tests/unit/compliance-confidence/complianceConfidence.test.ts`.

## Confidence Models

7D.4 produces:

- `COMPLIANCE_CONFIDENCE`
- `EVIDENCE_CONFIDENCE`
- `RECOMMENDATION_CONFIDENCE`

Each model uses explicit weighted inputs for evidence completeness, rule coverage, replay validation, lineage integrity, policy consistency, constitutional consistency, authority verification, and historical stability.

## Fail-Closed Rules

Missing inputs produce `UNKNOWN`. Replay mismatch, broken lineage, ledger write failure, tenant leakage, and hidden state block certification confidence. Missing evidence, incomplete rule coverage, authority uncertainty, policy inconsistency, constitutional inconsistency, and volatile history lower confidence deterministically.

## Replay

Every confidence record includes the input set, model version, weights, penalties, blockers, source refs, expected confidence score, expected level, expected calculation hash, and replay hash.

## Outcome

Mission Control can now attach deterministic confidence scores and explanations to compliance findings, evidence, and recommendations, preparing Phase 7D.5 for certification of the full compliance stack.
