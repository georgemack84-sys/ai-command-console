# Program 3 - CAF Legion Constitutional Foundation

Status: foundational constitutional baseline

Program: Program 3 - CAF Legion (Civitas Agent Framework)

Phase: P3.0 - Constitutional Foundation, Authority and Program Governance

Predecessors:

- [Program 2 - Program Foundation and Constitutional Authority Binding](./program-2-cci-program-foundation-constitutional-authority-binding.md)
- [Program 2 - Governance and Authority](./program-2-cci-governance-authority.md)
- [Program 2 - Evidence, Audit and Lineage](./program-2-cci-evidence-audit-lineage.md)
- [Program 2 - Registry, Metadata and Discovery](./program-2-cci-registry-metadata-discovery.md)

## Purpose

P3.0 establishes the constitutional identity, governance model, authority hierarchy, architectural boundaries, ownership model, namespace governance, terminology governance, specification governance, amendment governance, and constitutional lineage for CAF Legion.

P3.0 defines what CAF is allowed to be before any agent, runtime, capability, workflow, memory, planning, collaboration, or execution component exists.

No CAF component may establish independent authority outside this constitutional framework.

## Constitutional Principles

- Governance supremacy.
- Constitutional supremacy.
- Authority is explicitly granted and never inferred.
- All authority is bounded.
- Governance fails closed.
- Governance decisions are deterministic.
- Constitutional lineage is immutable.
- Ownership is explicit and singular.
- Ownership and implementation are separated.
- CAF remains constitutionally compatible with Program 2 CCI.

## Scope

P3.0 owns:

- CAF Constitution.
- CAF Authority Matrix.
- Cross-Program Terminology Registry.
- Authority Gate Warning Class Registry.
- Namespace Registry.
- Ownership Registry.
- Architectural Boundary Model.
- Amendment Governance Framework.
- Specification Governance Framework.
- Authority Precedence Rules.
- Ownership Inheritance Rules.
- Constitutional Lineage Records.

P3.0 does not execute runtime decisions. Runtime phases enforce the constitutional rules defined here.

## Authority Precedence

Authority flows downward only:

```text
Constitution
  -> Governance
  -> Operator
  -> CAF Authority Matrix
  -> Execution Components
```

Execution components cannot expand authority. Any ambiguity, collision, missing authority, invalid delegation, or constitutional conflict fails closed and must produce auditable evidence through CCI infrastructure.

## Workstream Coverage

| Workstream | Deliverable | Governing record |
| --- | --- | --- |
| P3.0.1 Constitutional Foundation | CAF Constitution | `P3.0-CAF-CONSTITUTION-001` |
| P3.0.2 Architectural Boundary Model | Boundary model | `P3.0-BOUNDARY-*` |
| P3.0.3 Authority Matrix | Authority records | `P3.0-AUTH-*` |
| P3.0.4 Authority Precedence Rules | Precedence specification | `P3.0-AUTH-PRECEDENCE-001` |
| P3.0.5 Ownership Governance | Ownership registry | `P3.0-OWN-*` |
| P3.0.6 Namespace Governance | Namespace registry | `P3.0-NS-*` |
| P3.0.7 Cross-Program Terminology Registry | Terminology registry | `P3.0-TERM-*` |
| P3.0.8 Authority Gate Warning Class Registry | Warning classes | `P3.0-WARN-*` |
| P3.0.9 Specification Governance | Specification lifecycle | `P3.0-SPEC-GOV-001` |
| P3.0.10 Amendment Governance | Amendment workflow | `P3.0-AMEND-GOV-001` |
| P3.0.11 Constitutional Compliance Validation | Validation report | `P3.0-CONSTITUTIONAL-VALIDATION-001` |
| P3.0.12 Phase Certification Gate | Certification gate | `P3.0-PHASE-CERTIFICATION-GATE-001` |

## Implementation Surface

The repository exposes the P3.0 baseline through:

- `types/caf-constitutional-foundation.ts`
- `services/caf-constitutional-foundation/index.ts`
- `app/api/caf-constitutional-foundation/contract`
- `app/api/caf-constitutional-foundation/authority`
- `app/api/caf-constitutional-foundation/ownership`
- `app/api/caf-constitutional-foundation/namespaces`
- `app/api/caf-constitutional-foundation/certification`
- `app/api/caf-constitutional-foundation/validate`

The service is deterministic and hash-backed. It publishes constitutional records, validation records, replay hashes, and phase certification outcomes. It intentionally does not perform runtime authorization or execution.

## Constitutional Invariants

1. No runtime authority may exist outside the CAF Authority Matrix.
2. Authority shall be explicitly granted and shall never be inferred.
3. Authority may only flow through the constitutional precedence hierarchy and shall never expand during execution.
4. Every constitutional artifact, capability, service, contract, registry, and specification shall have exactly one authoritative owner.
5. Every namespace shall be unique, governed, and registered before use.
6. Architectural boundaries shall be explicit, non-overlapping, and enforced across Program 3 and its dependencies.
7. Cross-program terminology shall remain canonically synchronized with Program 2.
8. Constitutional amendments and specification changes shall preserve immutable lineage, traceability, and deterministic supersession.
9. Governance, authority, ownership, and constitutional decisions shall produce auditable evidence through CCI infrastructure.
10. No later Program 3 phase may redefine or bypass P3.0 without a governed constitutional amendment.
