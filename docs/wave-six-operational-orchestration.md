# Wave 6.1 Operational Orchestration

Wave 6.1 establishes the operational orchestration layer responsible for deterministic scheduling, workflow coordination, background processing, operational queues, execution schedule registration, scheduling policies, coordination evidence, replay, and failure recovery across Proprium.

## Constitutional Boundary

Operational Orchestration decides when work executes and how scheduled work is coordinated. It never performs business logic directly. Actual execution is delegated to CAF or another authorized platform service. Queue ownership is centralized in Operational Orchestration, while runtime execution, infrastructure scheduling, identity, messaging, configuration, and observability remain owned by their existing platform services.

## Platform Capabilities

- Orchestration Scheduler for execution scheduling, workflow triggers, delays, retries, pause/resume/cancel operations, prioritization, schedule evaluation, trigger engine, retry coordination, scheduling policies, and CAF execution delegation.
- Workflow Scheduler, Background Coordination, and Operational Queue for recurring jobs, time/calendar/cron/event/dependency scheduling, background jobs, deferred and long-running work, batch execution, worker coordination, queue dispatch, queue persistence, recovery, queue replay, and queue evidence.
- Execution Schedule Registry and Scheduling Policies for schedule registration, versioning, ownership, metadata, execution history, replay metadata, immutable definitions, maximum concurrency, retry limits, backoff, priorities, maintenance windows, pause policies, and policy enforcement.
- Operational Coordination and Scheduling Evidence for dependency ordering, workflow sequencing, parallel and serialized scheduling, resource coordination, dependency graph, execution plans, schedule creation/modification evidence, trigger evidence, queue evidence, retry evidence, cancellation evidence, execution timeline, audit records, replay, and recoverability.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-critical scheduler, workflow, queue, registry, policy, evidence, audit, or trigger surfaces degrade to `CONDITIONALLY_QUALIFIED`. Constitutional failures such as invalid CAF runtime orchestration, invalid W5 PBG state, scheduler business-logic execution, nondeterministic scheduling, invalid recurring/dependency scheduling, lost background work, invalid worker coordination, decentralized queue ownership, nondeterministic queue replay, missing queue persistence/recovery, mutable schedule registry, policy bypass, invalid dependency ordering, mutable evidence, failed recovery, replay divergence, or tenant-isolation breach produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-six-operational-orchestration/contract`
- `POST /api/wave-six-operational-orchestration/validate`
- Section endpoints: `scheduler`, `workflow-background-queue`, `schedule-registry-policies`, `coordination-evidence`, and `readiness`
