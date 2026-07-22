# Wave 6.2 Dependency and Service Coordination

Wave 6.2 establishes the operational dependency coordination layer responsible for observing runtime dependencies, validating provider availability, evaluating orchestration readiness, coordinating dependency state, analyzing dependency failures, and producing immutable dependency evidence.

## Constitutional Boundary

W6.2 owns dependency awareness. It observes dependency state but never starts, stops, modifies, or executes services. Discovery is registry-driven through the CCI Service Registry. Unknown dependency state fails closed to `NOT_READY`, and W6.1 consumes readiness decisions without direct dependency inspection.

## Platform Capabilities

- Dependency Registry for identities, service relationships, consumer/provider mappings, runtime dependency graph, version awareness, required versus optional dependencies, metadata, registry-driven discovery, and unmanaged dependency rejection.
- Provider Observation for availability, connectivity, registration status, runtime heartbeat, capacity, health endpoints, maintenance state, provider transitions, failure propagation, recovery detection, latency, registration changes, events, timelines, and fail-closed health handling.
- Readiness and Coordination for required dependency availability, service health, runtime reachability, governance/trust/mission services, deterministic readiness, startup/shutdown ordering, stabilization, recovery coordination, synchronization, and readiness propagation without service lifecycle mutation.
- Operational Readiness and Failure Analysis for availability, dependency health, runtime stability, provider responsiveness, capability availability, consistency, reports, timelines, missing dependencies, timeouts, registration inconsistency, version incompatibility, circular dependencies, cascades, and deterministic impact assessments.
- Evidence for dependency snapshots, availability snapshots, readiness decisions, health history, transitions, failure and recovery evidence, lineage, replay, and W6.1 readiness consumption.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-critical registry, monitoring, observation, readiness, reporting, analysis, or evidence surfaces degrade to `CONDITIONALLY_QUALIFIED`. Constitutional failures such as invalid W6.1 state, nondeterministic dependency graph, unmanaged dependencies, missing health assumed available, unknown state not failing closed, invalid failure propagation, invalid recovery detection, nondeterministic readiness, unavailable required services treated as ready, service lifecycle mutation, invalid dependency sequencing, incomplete lineage, replay divergence, W6.1 bypassing readiness intelligence, or tenant-isolation breach produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-six-dependency-service-coordination/contract`
- `POST /api/wave-six-dependency-service-coordination/validate`
- Section endpoints: `dependency-registry`, `provider-observation`, `readiness-coordination`, `operational-readiness-failure-analysis`, `evidence`, and `readiness`
