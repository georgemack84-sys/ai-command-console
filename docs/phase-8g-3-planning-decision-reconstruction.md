# Phase 8G.3 — Planning & Decision Reconstruction

## Summary

Phase 8G.3 adds deterministic reconstruction for autonomous planning and decision-making. It rebuilds objective decomposition, alternative plan generation, selected strategy, decision reasoning, delegation routing, authority replay, optimization history, fallback evaluation, and planning confidence from immutable Replay Contract evidence.

## Delivered

- Planning replay identity with decision, delegation, authority, governance, Truth Ledger, replay, lineage, and integrity references.
- Objective hierarchy replay with deterministic sequence, priorities, constraints, dependencies, success criteria, and hashes.
- Alternative plan replay with assumptions, dependencies, duration, confidence, governance constraints, constitutional evaluation, advantages, tradeoffs, and rejection rationale.
- Decision replay with canonical reasoning sequence, evidence chain, rejected alternatives, tradeoff analysis, governance influence, constitutional influence, authority influence, and decision confidence.
- Delegation replay with delegated tasks, routing decisions, authority approvals, constraints, operator approvals, and outcomes.
- Reasoning replay with evidence chain, assumptions, optimization history, accepted and rejected optimizations, fallback evaluation, selected fallback, and confidence calculation hash.
- Validation outcomes for VERIFIED, PARTIAL, MISMATCH, and INVALID.
- Authenticated API routes under `/api/planning-decision-reconstruction`.

## API Surface

- `GET /api/planning-decision-reconstruction/contract`
- `POST /api/planning-decision-reconstruction/planning`
- `POST /api/planning-decision-reconstruction/decision`
- `POST /api/planning-decision-reconstruction/delegation`
- `POST /api/planning-decision-reconstruction/reasoning`
- `POST /api/planning-decision-reconstruction/validate`
- `POST /api/planning-decision-reconstruction/package`
- `GET|POST /api/planning-decision-reconstruction/inspect`

## Fail-Closed Coverage

The validator rejects planning divergence, decision mismatch, missing planning evidence, confidence mismatch, delegation inconsistency, authority mismatch, optimization divergence, fallback mismatch, governance inconsistency, lineage break, integrity failure, constitutional violation, and tenant isolation violation. No inferred, regenerated, or speculative reasoning is introduced during replay.
