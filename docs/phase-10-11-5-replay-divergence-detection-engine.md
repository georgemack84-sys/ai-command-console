# Phase 10.11.5 - Replay Divergence Detection Engine

## Purpose

Establish the deterministic Replay Divergence Detection Engine for identifying, classifying, explaining, and recording every behavioral difference between historical baseline replay and adapted replay execution.

No adaptive proposal may advance when divergence is hidden, unexplained, nondeterministic, governance-unsafe, or incompletely analyzed.

## Tightened Contract

- Engine version: `replay-divergence-detection-engine/v1`
- Engine identifier: `ReplayDivergenceDetectionEngine`
- Required predecessor: Phase 10.11.4 multi-domain impact simulation
- Divergence types: `EXPECTED`, `BENEFICIAL`, `HARMFUL`, `GOVERNANCE_CRITICAL`, `UNEXPLAINED`, `NONDETERMINISTIC`
- Severity levels: `INFORMATIONAL`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Replay proof: stable replay hash plus nested integrity hashes for API surface, multi-domain impact, comparisons, records, metrics, reports, and simulation validation ledger entry

## Comparison Scope

The engine compares recommendations, evidence, confidence, risk, governance, approvals, replay behavior, operator workflow, and rollback behavior.

Every scope records compared fields, validation requirements, detection status, classification, determinism, explainability, failures, and integrity hash.

## ReplayDivergenceRecord

Each detected divergence produces the canonical record from the prompt: divergence identity, proposal and tenant identity, baseline and adapted replay references, divergence type, cause, source proposal, affected subsystem, replay location, governance/confidence/recommendation/operator impacts, severity, explanation, certification effect, and integrity hash.

## Failure Behavior

The detector fails closed for undetected behavioral divergence, unexplained replay difference, nondeterministic replay, recommendation inconsistency without explanation, evidence inconsistency, confidence instability, risk instability, governance regression, constitutional violation, approval workflow bypass, rollback inconsistency, replay corruption, tenant isolation breach, integrity verification failure, incomplete analysis, or unavailable predecessor simulation.

## Implementation

- Types: `types/replay-divergence-detection-engine.ts`
- Service: `services/replay-divergence-detection-engine/index.ts`
- API routes: `app/api/replay-divergence-detection-engine/*`
- Tests: `tests/unit/replay-divergence-detection-engine/replayDivergenceDetectionEngine.test.ts`

The exported service exposes `detectReplayDivergence`, `replayReplayDivergenceDetection`, and `getReplayDivergenceDetectionFoundation`.
