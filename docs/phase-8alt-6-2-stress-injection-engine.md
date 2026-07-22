# Phase 8ALT.6.2 - Stress Injection Engine

The Stress Injection Engine converts certified scenario definitions into deterministic, replayable, simulation-only fault injection ledgers. It records injected events, schedules, timing, dependency graphs, replay markers, lineage references, evidence references, and integrity hashes without modifying production systems.

## Implemented Scope

- Immutable `InjectionEvent`, dependency graph, and append-only `StressInjectionLedger` contracts.
- Deterministic failure injection from `ScenarioDefinition` records.
- Sequential, parallel, deterministic-randomized, escalating, recursive, compound, progressive, mission-wide, and cross-subsystem injection modes.
- Replay synchronization, event scheduling, fault sequencing, dependency/cascade graph output, validation, replay, and observability.
- Fail-closed validation for missing or uncertified scenarios, nondeterministic ordering, missing seed, replay sync failure, governance/constitution bypass, authority elevation, policy modification, replay or Truth Ledger mutation, cross-tenant injection, hidden failures, incomplete evidence, and integrity failure.

## API Surface

- `GET /api/stress-injection-engine/contract`
- `POST /api/stress-injection-engine/inject`
- `POST /api/stress-injection-engine/schedule`
- `POST /api/stress-injection-engine/sequence`
- `POST /api/stress-injection-engine/dependencies`
- `POST /api/stress-injection-engine/replay`
- `POST /api/stress-injection-engine/validate`
- `GET|POST /api/stress-injection-engine/inspect`
