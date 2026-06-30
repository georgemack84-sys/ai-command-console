# Phase 8C.4 - Dependency Scheduler

## Purpose

The Dependency Scheduler deterministically validates and schedules task readiness according to task, resource, governance, operator, external, policy, synchronization, and checkpoint dependencies. It sits between Task Sequencing and Execution Monitoring and never executes tasks.

## Implemented Artifacts

- `types/dependency-scheduler.ts` defines dependency registry entries, graph edges, readiness records, dependency events, blocking reasons, recovery recommendations, monitoring records, schedule packages, validation, replay, visibility, and framework contracts.
- `services/dependency-scheduler/index.ts` implements dependency registration, graph construction, readiness evaluation, blocking analysis, recovery recommendation generation, monitoring, validation, replay, and visibility.
- `app/api/dependency-scheduler/*` exposes authenticated framework, registry, schedule, readiness, validate, replay, and visibility endpoints.
- `tests/unit/dependency-scheduler/dependencyScheduler.test.ts` covers baseline scheduling, dependency categories, readiness, recovery recommendations, failure scenarios, conditional monitoring warnings, replay, visibility, and framework publication.

## Governance Boundary

The scheduler determines execution eligibility only. It does not execute tasks, bypass dependencies, approve recovery, escalate authority, or override governance.
