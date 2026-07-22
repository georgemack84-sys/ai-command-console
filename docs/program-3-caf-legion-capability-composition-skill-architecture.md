# Program 3 - CAF Legion Capability Composition and Skill Architecture

Status: planned composition baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.2 - Capability Composition and Skill Architecture

Predecessors:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 3 - CAF Legion Agent Identity and Lifecycle](./program-3-caf-legion-agent-identity-lifecycle.md)
- [Program 1 - Capability Atlas Capability Registry](./program-1-capability-atlas-capability-registry.md)
- [Program 1 - Capability Atlas Dependency Architecture](./program-1-capability-atlas-dependency-architecture.md)
- [Program 1 - Capability Atlas Model Composition](./program-1-capability-atlas-model-composition.md)

## Purpose

P3.2 establishes the constitutional framework for composing CAF agents from reusable capabilities and skills defined by the Capability Atlas.

Agents never implement behavior directly. Every behavior is assembled from certified capabilities using governed composition rules, deterministic dependency validation, reusable skill architecture, composition contracts, lineage, evidence, and replay.

## Scope

P3.2 owns:

- Capability composition.
- Skill composition.
- Reusable behaviors.
- Dependency composition.

P3.2 does not own:

- Capability definitions, which remain owned by Program 1.
- Lifecycle management, which remains owned by P3.1.
- Execution planning or runtime execution.
- Policy enforcement or governance authority.

## Core Principles

- Capability-first architecture.
- Composition before implementation.
- Deterministic composition.
- Capability reuse.
- Immutable composition lineage.
- Dependency integrity.
- Constitutional governance before availability.

## Workstream Coverage

| Workstream | Deliverable | Governing record |
| --- | --- | --- |
| P3.2.1 Composition Foundation | Composition framework and vocabulary | `P3.2-COMPOSITION-001` |
| P3.2.2 Capability Composition Engine | Composition planner and resolver | `P3.2-COMPOSITION-001` |
| P3.2.3 Skill Architecture | Skill registry and catalog | `P3.2-SKILL-*` |
| P3.2.4 Behavior Composition | Behavior library and templates | `P3.2-BEHAVIOR-*` |
| P3.2.5 Dependency Composition | Dependency graph and validator | `P3.2-DEPENDENCY-GRAPH-001` |
| P3.2.6 Composition Contracts | Contract library | `P3.2-CONTRACT-LIBRARY-001` |
| P3.2.7 Validation and Certification | Validation evidence | `P3.2-EVIDENCE-*` |
| P3.2.8 Lineage and Evidence | Composition evidence and replay | `P3.2-REPLAY-VALIDATION-001` |
| P3.2.9 Registry Services | Composition registry | `P3.2-COMPOSITION-REGISTRY-001` |
| P3.2.10 Certification Gate | Certification report | `P3.2-CERTIFICATION-GATE-001` |

## Implementation Surface

The repository exposes the P3.2 baseline through:

- `types/caf-capability-composition.ts`
- `services/caf-capability-composition/index.ts`
- `app/api/caf-capability-composition/contract`
- `app/api/caf-capability-composition/registry`
- `app/api/caf-capability-composition/skills`
- `app/api/caf-capability-composition/dependencies`
- `app/api/caf-capability-composition/lineage`
- `app/api/caf-capability-composition/certification`
- `app/api/caf-capability-composition/validate`

The service publishes deterministic composition, dependency graph, skill registry, behavior library, contract library, composition registry, evidence, replay, and certification records.

## Exit Criteria

P3.2 is complete when:

- Every composed behavior references canonical capabilities.
- Reusable skill architecture is operational.
- Composition contracts govern all assemblies.
- Dependency validation is deterministic.
- Circular dependencies are eliminated.
- Capability reuse is enforced.
- Behavior duplication is prohibited.
- Composition lineage is complete.
- Replay produces identical compositions.
- Registry services are operational.
- Validation evidence is complete.
- Constitutional compliance is verified.
- Composition certification passes.
- Downstream phases can consume certified skills without redefining capabilities.
