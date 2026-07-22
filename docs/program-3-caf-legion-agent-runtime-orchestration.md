# Program 3 - CAF Legion Agent Runtime Orchestration

Status: runtime orchestration baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.3 - Agent Runtime Orchestration

Predecessors:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 3 - CAF Legion Agent Identity and Lifecycle](./program-3-caf-legion-agent-identity-lifecycle.md)
- [Program 3 - CAF Legion Capability Composition and Skill Architecture](./program-3-caf-legion-capability-composition-skill-architecture.md)
- [Program 2 - CCI Shared Runtime Services](./program-2-cci-shared-runtime-services.md)
- [Program 2 - CCI Runtime Policy Enforcement](./program-2-cci-runtime-policy-enforcement.md)

## Purpose

P3.3 establishes the deterministic runtime execution environment for CAF agents by orchestrating agent execution, scheduling, lifecycle supervision, runtime state, dependency coordination, governance admission, evidence, replay, and observability on top of CCI shared runtime services.

Program 3 owns orchestration of agent behavior within the runtime. It does not replace or redefine CCI runtime infrastructure.

## Scope

P3.3 defines:

- Runtime orchestration.
- Execution management.
- Scheduling orchestration.
- Lifecycle supervision.
- Runtime state coordination.
- Execution dependency management.
- Runtime contracts.
- Runtime governance integration.
- Runtime evidence and replay.

P3.3 does not define agent intelligence, planning, learning, memory, or communication semantics.

## Runtime Lifecycle Model

Nominal path:

```text
REGISTERED
  -> INITIALIZING
  -> READY
  -> SCHEDULED
  -> EXECUTING
  -> WAITING
  -> EXECUTING
  -> COMPLETED
```

Exceptional states:

```text
FAILED
SUSPENDED
STOPPING
TERMINATED
RECOVERING
RETIRED
```

Every transition is deterministic, replayable, and governed.

## Workstream Coverage

| Component | Deliverable | Governing record |
| --- | --- | --- |
| Runtime Orchestrator | Agent runtime coordination | `P3.3-RUNTIME-ORCHESTRATOR-001` |
| Lifecycle Supervisor | Runtime lifecycle supervision | `P3.3-LIFECYCLE-SUPERVISOR-001` |
| Scheduling Engine | Deterministic scheduling | `P3.3-SCHEDULING-ENGINE-001` |
| Execution Coordinator | Dependency and concurrency coordination | `P3.3-EXECUTION-COORDINATOR-001` |
| Runtime State Manager | Runtime state snapshots | `P3.3-RUNTIME-STATE-001` |
| Runtime Governance Adapter | CCI governance integration | `P3.3-RUNTIME-GOVERNANCE-ADAPTER-001` |
| Runtime Evidence Adapter | Runtime evidence ledger | `P3.3-EVIDENCE-*` |
| Runtime Contracts | Versioned replay-safe contracts | `P3.3-RUNTIME-CONTRACT-LIBRARY-001` |
| Replay Specification | Deterministic runtime replay | `P3.3-RUNTIME-REPLAY-VALIDATION-001` |
| Certification Gate | Runtime certification report | `P3.3-RUNTIME-CERTIFICATION-GATE-001` |

## Implementation Surface

The repository exposes the P3.3 baseline through:

- `types/caf-runtime-orchestration.ts`
- `services/caf-runtime-orchestration/index.ts`
- `app/api/caf-runtime-orchestration/contract`
- `app/api/caf-runtime-orchestration/runtime`
- `app/api/caf-runtime-orchestration/scheduling`
- `app/api/caf-runtime-orchestration/coordination`
- `app/api/caf-runtime-orchestration/evidence`
- `app/api/caf-runtime-orchestration/certification`
- `app/api/caf-runtime-orchestration/validate`

The service publishes deterministic orchestration, lifecycle, scheduling, coordination, state, governance, contract, evidence, replay, observability, and certification records.

## Exit Criteria

P3.3 is complete when:

- All agent execution is orchestrated through the Runtime Orchestrator.
- Scheduling is deterministic, governed, and replayable.
- Lifecycle supervision manages every runtime state transition.
- Execution coordination synchronizes dependencies and concurrent workloads.
- Runtime contracts are fully specified, versioned, and validated.
- Runtime evidence is immutable, complete, and linked to execution lineage.
- Runtime orchestration integrates with CCI Shared Runtime Services without redefining infrastructure.
- Runtime actions enforce constitutional governance and fail closed on violations.
- Replay reconstructs runtime behavior with no unexplained divergence.
- Observability covers orchestration, scheduling, lifecycle, execution coordination, and recovery.
- The phase is certified as constitutionally compliant for higher-level CAF execution capabilities.
