# Phase 9.10.4 - Deterministic Replay Engine

## Preview

The Deterministic Replay Engine reconstructs decision orchestration from the canonical replay contract, immutable snapshots, trace records, ledgers, governance evidence, operator actions, and final decision state. It restores recorded state, validates equality against the original orchestration, detects divergence, produces a replay report, and commits replay evidence immutably.

## Tightened Contract

- Replay uses only recorded artifacts from the Phase 9.10 contract, snapshot, and trace layers.
- Replay restores inputs, contexts, graph, priorities, conflicts, governance, packages, operator workflow, and final decision state in strict deterministic order.
- Replay cannot call live systems, execute recommendations, mutate original orchestration history, substitute operator actions, or reinterpret governance.
- Equality is validated across all required replay domains.
- Divergence, missing artifacts, integrity mismatch, broken lineage, tenant mismatch, missing governance or constitutional artifacts, missing operator workflow, original mutation, external execution, live lookup, and ledger failures fail closed.
- Replay reports and execution records are hash-verifiable and certification-ready only when every equality and integrity check passes.

## Implementation

- Types: `types/decision-deterministic-replay-engine.ts`
- Service: `services/decision-deterministic-replay-engine/index.ts`
- Tests: `tests/unit/decision-deterministic-replay-engine/decisionDeterministicReplayEngine.test.ts`

The service provides artifact loading, state restoration, deterministic replay execution, equality validation, divergence detection, report generation, and append-only replay ledger writing for Phase 9.10 replay certification.
