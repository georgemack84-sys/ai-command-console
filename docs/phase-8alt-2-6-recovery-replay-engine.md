# Phase 8ALT.2.6 - Recovery Replay Engine

## Purpose

Phase 8ALT.2.6 implements deterministic replay for Autonomous Recovery Intelligence. It reconstructs recovery reasoning from immutable evidence and compares replayed outputs against original recovery records.

The engine does not execute recovery. It only replays, compares, classifies, and verifies recovery intelligence.

## Implementation

- `types/recovery-replay-engine.ts` defines replay states, reconstruction records, replay result objects, validation results, and observability surfaces.
- `services/recovery-replay-engine/index.ts` reconstructs failure analysis, recovery planning, dependency graphs, alternatives, confidence, recommendations, and governance validation from recommendation packages.
- `app/api/recovery-replay-engine/*` exposes authenticated contract, replay, comparison, validation, and evidence routes.
- `tests/unit/recovery-replay-engine/recoveryReplayEngine.test.ts` verifies reproduced, mismatch, incomplete, and invalid replay states plus deterministic hashing and advisory-only constraints.

## Replay States

- `REPRODUCED`: all reconstructed outputs match immutable originals.
- `MISMATCH`: replay completes but confidence, recommendation, dependency, governance, ranking, or integrity differs.
- `INCOMPLETE`: required failure, plan, dependency, governance, replay, or lineage evidence is missing.
- `INVALID`: replay cannot be trusted due to corruption, mutation, tenant boundary violation, schema/request failure, history rewrite, fabricated evidence, suppressed mismatch, recovery execution, or approval attempt.

## Guarantees

- Replay never modifies recovery history.
- Missing evidence and mismatches are fail-closed.
- Tenant isolation is enforced.
- Replay outputs are immutable, auditable, and certification-ready.

## Verification

Run:

```bash
npx vitest run tests/unit/recovery-replay-engine
npm run typecheck
```
