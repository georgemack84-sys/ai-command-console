# Wave 5.5 Tasks and Commitments

Wave 5.5 establishes the Tasks and Commitments platform for capturing, organizing, planning, scheduling, tracking, and reviewing work. It turns goals and plans into executable commitments while preserving governance, evidence, tenant isolation, and deterministic replay.

## Platform Capabilities

- Task Foundation for identities, registry, metadata, categories, templates, relationships, parent/child tasks, dependencies, tags, ownership, certified APIs, and deterministic identity.
- Commitment Management for personal, organizational, and delegated commitments with independent lifecycle, due dates, priorities, status, ownership, and complete history.
- Planning Engine for goal breakdown, task generation, milestones, dependency planning, sequencing, priority calculation, capacity planning, estimates, optimization, and validation.
- Task Lifecycle for creation, assignment, scheduling, progress, status changes, blocked/waiting states, completion, cancellation, archiving, history, and replay.
- Prioritization and Scheduling for importance, urgency, deadlines, capacity, daily and weekly planning, work queues, rules, and conflict detection.
- Weekly Review for dashboards, completed tasks, outstanding commitments, deferred work, carry-forward, wins, lessons, planning, capacity, goal alignment, reports, and retained history.
- Dependency Graph for blocking, sequential, parallel, milestone, critical-path, readiness, validation, and circular-dependency prevention.
- Integration and Governance for Calendar, Context, Knowledge, Notifications, Collaboration, deterministic events, audit trail, evidence, task and commitment lineage, policies, permissions, replay, reporting, and tenant isolation.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-critical surfaces degrade to `CONDITIONALLY_QUALIFIED`. Constitutional failures such as nondeterministic task identity, invalid task relationships, non-independent commitments, nonreproducible plans, invalid state transitions, replay divergence, unenforced capacity, circular dependencies, invalid synchronization, mutable evidence, incomplete lineage, governance bypass, or tenant-isolation breach produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-five-tasks-commitments/contract`
- `POST /api/wave-five-tasks-commitments/validate`
- Section endpoints: `tasks`, `commitments`, `planning`, `lifecycle`, `prioritization-scheduling`, `weekly-review`, `dependencies`, `integration-governance`, and `readiness`
