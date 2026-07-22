# Mission Control Phase 9.2.1 - Decision Intake Engine

## Preview

Phase 9.2.1 implements the deterministic ingress point for Phase 9 decision candidates. It receives submissions from certified Mission Control subsystems, validates source, tenant, mission, schema, authority, and integrity, assigns deterministic intake sequencing, records immutable audit evidence, and forwards only accepted candidates to the future normalization adapter.

## Tightened Scope

- Intake validates and records candidates; it does not normalize, score, deduplicate, prioritize, or orchestrate decisions.
- Accepted candidates are forwarded only as a routing flag for the downstream Input Normalization Adapter.
- Batch intake is atomic by default; partial acceptance must be explicitly enabled.
- Replay intake reconstructs prior intake results and does not generate new identifiers.
- Sequencing is deterministic by mission id, candidate timestamp, source priority, source record id, and candidate id.
- Phase 9.1 certification must pass before intake can accept candidates.

## Implementation

- `types/decision-intake-engine.ts` defines intake modes, states, failures, candidate payloads, requests, validation records, sequence records, audit records, results, batch results, replay results, source registration, and observability.
- `services/decision-intake-engine/index.ts` implements source verification, tenant validation, mission validation, schema validation, authority checks, integrity checks, sequencing, batch intake, replay, audit evidence, and observability.
- `tests/unit/decision-intake-engine/decisionIntakeEngine.test.ts` verifies synchronous, asynchronous, batch, replay, boundary rejection, duplicate detection, deterministic ordering, no-forwarding on rejection, and observability.

## Public API

- `createDecisionCandidatePayload`
- `createDecisionIntakeRequest`
- `validateDecisionIntakeRequest`
- `orderDecisionIntakeRequests`
- `receiveDecisionCandidate`
- `receiveDecisionBatch`
- `replayDecisionIntake`
- `buildDecisionIntakeObservability`
- `getDecisionIntakeEngine`
