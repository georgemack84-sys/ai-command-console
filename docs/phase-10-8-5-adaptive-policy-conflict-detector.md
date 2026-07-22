# Phase 10.8.5 - Adaptive Policy Conflict Detector

The Adaptive Policy Conflict Detector is the policy consistency engine for the Governance-Aware Adaptation Layer. It identifies, classifies, explains, and routes conflicts between adaptive proposals and the governance, constitutional, authority, tenant, certification, audit, replay, evidence, rollback, and compliance policies that constrain Mission Control.

## Tightened Prompt

Detect every policy conflict before simulation or review. Resolve applicable policies and dependencies, identify contradictions, classify conflict category and severity, generate deterministic resolution paths, assign the minimum required reviewers, and persist an immutable conflict ledger entry.

The detector must remain constitution-first, governance-driven, deterministic, explainable, replayable, evidence-backed, advisory-only, human-governed, fail-closed, tenant-isolated, immutable, audit-ready, lineage-preserving, and conflict-transparent. It never overrides governance policy and never auto-resolves conflicts.

## Implemented Scope

- Typed conflict contract in `types/adaptive-policy-conflict-detector.ts`.
- Deterministic service in `services/adaptive-policy-conflict-detector`.
- Evaluated policy, detected conflict, severity, resolution path, reviewer assignment, replay, and ledger outputs.
- Explicit non-overriding posture: `governance_override_supported: false`, `conflict_auto_resolution_supported: false`, and `advisory_only: true`.
- Fail-closed handling for unresolved precedence, irreconcilable governance and constitutional conflicts, mutually exclusive approvals, unresolved constitutional conflicts, blocking certification conflicts, unauthorized authority expansion, audit integrity loss, replay nondeterminism, contradictory evidence, unavailable rollback, unsatisfied compliance, nondeterminism, lineage gaps, replay divergence, hash failure, and recording failure.
- Authenticated APIs under `/api/adaptive-policy-conflict-detector/*`.

## API Surface

- `GET /api/adaptive-policy-conflict-detector/contract`
- `POST /api/adaptive-policy-conflict-detector/analyze`
- `POST /api/adaptive-policy-conflict-detector/policies`
- `POST /api/adaptive-policy-conflict-detector/conflicts`
- `POST /api/adaptive-policy-conflict-detector/severity`
- `POST /api/adaptive-policy-conflict-detector/resolution`
- `POST /api/adaptive-policy-conflict-detector/reviewers`
- `POST /api/adaptive-policy-conflict-detector/ledger`
- `POST /api/adaptive-policy-conflict-detector/replay`
- `GET|POST /api/adaptive-policy-conflict-detector/inspect`

## Conflict States

- `NO_CONFLICT`
- `RESOLUTION_AVAILABLE`
- `REQUIRES_OPERATOR_REVIEW`
- `REQUIRES_GOVERNANCE_REVIEW`
- `REQUIRES_CONSTITUTIONAL_REVIEW`
- `REQUIRES_MULTI_STAGE_REVIEW`
- `BLOCKED`
- `FAIL_CLOSED`

## Certification Notes

- No conflict is resolved automatically.
- Resolvable conflicts receive resolution paths and reviewer assignments.
- Irreconcilable or unresolved conflicts fail closed.
- Replay compares deterministic analysis and integrity hashes.
