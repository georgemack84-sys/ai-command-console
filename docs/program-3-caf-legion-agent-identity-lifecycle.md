# Program 3 - CAF Legion Agent Identity and Lifecycle

Status: foundational lifecycle baseline

Program: Program 3 - CAF Legion (Civitas Agent Framework)

Phase: P3.1 - Agent Identity and Lifecycle

Predecessors:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 2 - Identity and Principal Infrastructure](./program-2-cci-identity-principal-infrastructure.md)
- [Program 2 - Registry, Metadata and Discovery](./program-2-cci-registry-metadata-discovery.md)
- [Program 2 - Evidence, Audit and Lineage](./program-2-cci-evidence-audit-lineage.md)
- [Program 2 - Replay and Determinism](./program-2-cci-replay-determinism.md)
- [Program 2 - Governance and Authority](./program-2-cci-governance-authority.md)

## Purpose

P3.1 establishes the constitutional identity, lifecycle, and governance framework for every CAF Legion agent.

It defines how agents are created, identified, activated, versioned, suspended, recovered, retired, archived, and replayed throughout their existence.

P3.1 owns agent identity and lifecycle governance. It consumes CCI identity infrastructure and shall not implement authentication, credentials, trust anchors, or identity infrastructure owned by Program 2.

## Scope

P3.1 defines:

- Agent identity model.
- Agent registry.
- Lifecycle state machine.
- Activation governance.
- Suspension and recovery governance.
- Retirement governance.
- Version lineage.
- Lifecycle evidence.
- Lifecycle observability.
- Certification requirements.

## Lifecycle State Machine

Legal states:

```text
REGISTERED
  -> VALIDATED
  -> APPROVED
  -> READY
  -> ACTIVATED
  -> ACTIVE
```

Operational branches:

```text
ACTIVE -> SUSPENDED -> RESUMING -> ACTIVE
ACTIVE -> UPGRADING -> ACTIVE
ACTIVE -> RETIRED -> ARCHIVED
```

Undefined transitions are prohibited. Skipped approvals are prohibited. Activation without governance is prohibited. Retired agents cannot reactivate. Archived agents are immutable.

## Workstream Coverage

| Workstream | Deliverable | Governing record |
| --- | --- | --- |
| P3.1.1 Agent Identity Foundation | Agent identity specification | `P3.1-identity` |
| P3.1.2 Agent Registry | Agent registry | `P3.1-AGENT-REGISTRY-001` |
| P3.1.3 Lifecycle Model | Lifecycle state machine | `P3.1-LIFECYCLE-CONTRACT-001` |
| P3.1.4 Activation Governance | Activation record and ledger | `P3.1-ACTIVATION-001` |
| P3.1.5 Suspension and Recovery | Suspension/recovery record | `P3.1-SUSPENSION-001` |
| P3.1.6 Retirement Governance | Retirement policy record | `P3.1-RETIREMENT-001` |
| P3.1.7 Version Lineage | Version lineage registry | `P3.1-VERSION-LINEAGE-001` |
| P3.1.8 Lifecycle Evidence | Lifecycle evidence ledger | `P3.1-EVIDENCE-*` |
| P3.1.9 Observability | Lifecycle observability | `P3.1-OBSERVABILITY-001` |
| P3.1.10 Certification Gate | Certification report | `P3.1-CERTIFICATION-GATE-001` |

## Implementation Surface

The repository exposes the P3.1 baseline through:

- `types/caf-agent-identity-lifecycle.ts`
- `services/caf-agent-identity-lifecycle/index.ts`
- `app/api/caf-agent-identity-lifecycle/contract`
- `app/api/caf-agent-identity-lifecycle/registry`
- `app/api/caf-agent-identity-lifecycle/lifecycle`
- `app/api/caf-agent-identity-lifecycle/activation`
- `app/api/caf-agent-identity-lifecycle/lineage`
- `app/api/caf-agent-identity-lifecycle/certification`
- `app/api/caf-agent-identity-lifecycle/validate`

The service publishes deterministic identity, registry, lifecycle, activation, suspension, retirement, lineage, evidence, observability, replay, and certification records. It binds to P3.0 through `P3.0-CAF-CONSTITUTION-001`.

## Exit Criteria

P3.1 is complete when:

- Every agent has a permanent deterministic identity.
- Identity namespaces are governed and collision-free.
- Every agent exists in an immutable replayable registry.
- Lifecycle transitions are constitutionally governed.
- Activation, suspension, recovery, and retirement are deterministic.
- Version lineage is complete and immutable.
- Every lifecycle event generates immutable evidence.
- Replay reconstructs every lifecycle transition exactly.
- Registry integrity is verified.
- Multi-tenant isolation is preserved.
- Lifecycle contracts are certified for future CAF phases.
