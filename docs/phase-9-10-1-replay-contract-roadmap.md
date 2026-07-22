# Phase 9.10.1 - Replay Contract Roadmap

## Preview

The canonical Decision Replay Contract defines the only supported boundary for replaying orchestrated decisions. It covers replay identity, version pins, immutable metadata, explicit inputs and outputs, lineage, governance and constitutional references, validation, integrity hashing, audit compatibility, and execution gating.

## Tightened Contract

- Replay records are advisory-only reconstruction contracts and cannot mutate original orchestration artifacts.
- Replay execution is allowed only when the record validates to `READY_FOR_REPLAY`.
- Contract, schema, engine, and validation-rule versions are pinned and unsupported versions fail closed.
- Replay inputs are references, not embedded mutable state.
- Lineage, governance, constitutional, audit, and certification references are tenant-scoped and orchestration-scoped.
- Integrity hashes are computed from canonical replay identity, versions, inputs, lineage, governance, constitutional references, and replay state.
- Unknown states, missing refs, malformed hashes, cross-tenant references, skipped validation, and output mutation are blocked.

## Implementation

- Types: `types/decision-replay-contract.ts`
- Service: `services/decision-replay-contract/index.ts`
- Tests: `tests/unit/decision-replay-contract/decisionReplayContract.test.ts`

The service provides a replay schema registry, version resolver behavior, metadata freezer, deterministic hasher, validator, and execution guard for Phase 9.10 replay work.
