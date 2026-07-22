# W2.2 Lifecycle Engine

W2.2 establishes the authoritative lifecycle-control infrastructure for CAF Legion agents and runtime instances. Runtime instance lifecycle is the final execution-control lifecycle; process status, registry status, agent status, health, certification, and trust standing may constrain execution but cannot independently authorize it.

## Constitutional Scope

- Owns agent lifecycle, runtime instance lifecycle, lifecycle coupling, transition validation, health services, recovery, suspension, retirement, revocation, lifecycle history, deterministic replay, lifecycle APIs, observability, evidence, and qualification.
- Consumes W2.0 CAF Constitutional Foundation and W2.1 Agent Registry.
- Requires every lifecycle transition to be validated, versioned, atomically committed, recorded, evidenced, tenant-scoped, and replayable.
- Fails closed for invalid dependencies, non-authoritative runtime lifecycle, execution outside permitted state, invalid transition allowance, terminal-state exit, stale mutation, failed propagation, health authorizing execution, recovery bypassing revocation, mutable history, replay divergence, tenant isolation failure, invalid orchestrator integration, or registry projections becoming authoritative.

## Implementation

- Contract: `types/lifecycle-engine.ts`
- Service: `services/lifecycle-engine/index.ts`
- API: `app/api/lifecycle-engine/*`
- Tests: `tests/unit/lifecycle-engine/lifecycleEngine.test.ts`

## Qualification

The qualification suite verifies state-machine completeness, runtime execution authority, terminal-state enforcement, transition validation, optimistic concurrency, idempotency, coupling, health advisory behavior, bounded recovery, suspension, retirement, revocation precedence, immutable history, deterministic replay, lifecycle APIs, observability, evidence integrity, gate failure, and fail-closed critical defects.

The canonical successful readiness decision is `W2_2_LIFECYCLE_ENGINE_QUALIFIED`.
