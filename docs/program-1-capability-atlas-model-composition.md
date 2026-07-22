# Program 1 - Capability Model and Composition

Status: model and composition baseline

Program: Program 1 - Capability Atlas

Phase: P1.4 - Capability Model and Composition

Predecessors:

- [Program 1 - Capability Discovery and Decomposition](./program-1-capability-atlas-discovery-decomposition.md)
- [Program 1 - Capability Identity](./program-1-capability-atlas-capability-identity.md)

Successor:

- [Program 1 - Atlas Schema Governance](./program-1-capability-atlas-schema-governance.md)

## Purpose

P1.4 defines the constitutional model governing how capabilities are represented, composed, bundled, and consumed throughout the Civitas ecosystem.

This phase establishes the distinction between atomic capabilities, capability bundles, and platforms so composition remains deterministic while preserving immutable capability identity, ownership, lineage, and certification traceability.

## Scope

P1.4 establishes:

- Capability Model Specification.
- Atomic Capability Contract.
- Capability Bundle Contract.
- Platform Composition Contract.
- Composition Rules.
- Composition Validation Engine.
- Composition Dependency Graph.
- Composition Registry.
- Composition Evidence Model.
- Composition Replay Service.

P1.4 does not:

- Redefine capability identity.
- Transfer ownership from atomic capabilities to bundles or platforms.
- Certify platform runtime implementation.
- Permit hidden or implicit composition.

## Capability Hierarchy

Hierarchy ID: `P1.4-COMP-HIER-001`

```text
Platform
  -> Capability Bundle
  -> Atomic Capability
```

Ownership always resides at the atomic capability level.

Bundles organize capabilities for reuse.

Platforms consume bundles and capabilities to define deployable implementation boundaries.

## Capability Model Specification

Specification ID: `P1.4-CAP-MODEL-SPEC-001`

Every capability shall define:

- Capability ID.
- Namespace.
- Owner.
- Purpose.
- Responsibilities.
- Inputs.
- Outputs.
- Dependencies.
- Contracts.
- Constraints.
- Policies.
- Evidence requirements.
- Certification status.
- Version.
- Lineage.
- Lifecycle state.

Capability model rules:

- Capability identity is immutable.
- Capability responsibility is singular for atomic capabilities.
- Capability ownership is unique.
- Capability lineage is append-only.
- Capability dependencies are explicit.
- Capability certification status is independently traceable.

## Atomic Capability Contract

Contract ID: `P1.4-ATOMIC-CONTRACT-001`

An atomic capability is the smallest independently governable capability.

Characteristics:

- One responsibility.
- One owner.
- One immutable identity.
- Independently certifiable.
- Independently versioned.
- Reusable.
- Implementation independent.

Atomic constraints:

- Atomic capabilities may not contain other capabilities.
- Atomic capabilities may depend on other capabilities.
- Atomic capabilities remain independently identifiable.
- Atomic capabilities remain independently certifiable.
- Atomic capabilities remain independently traceable when bundled or consumed by platforms.

## Capability Bundle Contract

Contract ID: `P1.4-BUNDLE-CONTRACT-001`

A capability bundle is a governed collection of atomic capabilities assembled for reuse.

Bundle model fields:

- Bundle ID.
- Bundle namespace.
- Bundle owner.
- Included capabilities.
- Bundle version.
- Bundle contracts.
- Bundle dependencies.
- Bundle evidence.
- Bundle certification.
- Bundle lineage.

Bundle rules:

- Bundles contain only registered atomic capabilities.
- Bundles may reference other bundles.
- Bundles preserve atomic capability identity.
- Bundles preserve atomic capability ownership.
- Bundles preserve dependency lineage.
- Bundles never duplicate capabilities.
- Bundles never redefine capabilities.
- Bundles exist solely for composition.

## Platform Composition Contract

Contract ID: `P1.4-PLATFORM-COMP-CONTRACT-001`

A platform is a governed implementation assembled from capability bundles and registered capabilities.

Platform model fields:

- Platform ID.
- Platform name.
- Platform scope.
- Consumed bundles.
- Directly consumed atomic capabilities.
- Platform dependencies.
- Extension points.
- Platform contracts.
- Platform certification.
- Platform evidence.
- Platform lineage.

Platform rules:

- Platforms consume bundles.
- Platforms may consume atomic capabilities directly.
- Platforms inherit capabilities.
- Platforms never own constituent capabilities.
- Platforms never redefine ownership.
- Platforms never duplicate capabilities.
- Platforms never alter capability identity.
- Platforms define implementation boundaries.

## Composition Rules

Rule registry ID: `P1.4-COMP-RULE-REG-001`

Constitutional rules:

- Atomic capability identity is immutable.
- Capability ownership is unique.
- Capability composition preserves identity.
- Composition never rewrites lineage.
- Bundles are organizational rather than authoritative.
- Platforms inherit capabilities rather than redefine them.
- Every composed capability remains independently traceable.
- Every composition produces constitutional evidence.
- Every composition is replayable.
- Composition is deterministic.

Prohibited composition:

- Composite atomic capabilities.
- Duplicated capabilities.
- Hidden dependencies.
- Cyclic composition.
- Identity rewriting.
- Ownership reassignment.
- Implicit composition.
- Anonymous capabilities.
- Orphaned dependencies.

## Composition Registry

Registry ID: `P1.4-COMP-REG-001`

The Composition Registry records all bundle and platform composition relationships.

Record types:

- Atomic capability inclusion record.
- Bundle composition record.
- Bundle dependency record.
- Platform composition record.
- Direct atomic consumption record.
- Extension point record.
- Composition version record.
- Composition certification record.
- Composition lineage record.

Registry requirements:

- Composition records are append-only.
- Composition state is derived from recorded composition events.
- Composition records reference immutable Capability IDs.
- Bundle and platform records shall not copy or redefine atomic capability fields.
- Historical composition remains permanently traceable.

## Composition Dependency Graph

Graph ID: `P1.4-COMP-DEP-GRAPH-001`

The Composition Dependency Graph records relationships among atomic capabilities, bundles, and platforms.

Node types:

- Atomic capability.
- Capability bundle.
- Platform.
- Extension point.
- Contract.

Edge types:

- `DEPENDS_ON`
- `INCLUDED_IN_BUNDLE`
- `BUNDLE_REFERENCES_BUNDLE`
- `CONSUMED_BY_PLATFORM`
- `DIRECTLY_CONSUMED_BY_PLATFORM`
- `EXPOSES_CONTRACT`
- `IMPLEMENTS_EXTENSION_POINT`
- `SUPERSEDED_BY`

Graph rules:

- Cyclic composition is prohibited.
- Dependency edges shall be explicit.
- Orphaned dependencies are prohibited.
- Graph traversal shall preserve identity and ownership.
- Graph replay shall reproduce deterministic composition.

## Composition Validation Engine

Engine ID: `P1.4-COMP-VAL-ENG-001`

The Composition Validation Engine verifies:

- Atomic integrity.
- Bundle integrity.
- Platform integrity.
- Dependency completeness.
- Ownership preservation.
- Namespace consistency.
- Lineage preservation.
- Certification inheritance.
- Identity uniqueness.
- Deterministic composition.

Validation outcomes:

- `VALID`
- `INVALID_ATOMIC_COMPOSITE`
- `DUPLICATE_CAPABILITY`
- `HIDDEN_DEPENDENCY`
- `CYCLIC_COMPOSITION`
- `OWNERSHIP_REDEFINED`
- `IDENTITY_REWRITTEN`
- `LINEAGE_INCOMPLETE`
- `CERTIFICATION_INHERITANCE_INVALID`
- `REQUIRES_GOVERNANCE_REVIEW`

## Composition Evidence Model

Evidence model ID: `P1.4-COMP-EVID-MODEL-001`

Each composition produces:

- Composition record.
- Dependency graph.
- Ownership validation.
- Identity validation.
- Lineage validation.
- Certification validation.
- Bundle validation.
- Platform validation.
- Replay validation.
- Integrity hash.

Evidence requirements:

- Evidence shall bind to immutable identities.
- Evidence shall record validator and policy versions.
- Evidence shall support independent audit.
- Evidence shall support deterministic replay.

## Composition Lifecycle

Lifecycle ID: `P1.4-COMP-LIFECYCLE-001`

```text
Atomic Capability Created
  -> Capability Qualified
  -> Capability Registered
  -> Capability Bundled
  -> Bundle Certified
  -> Platform Composed
  -> Platform Certified
```

Lifecycle constraints:

- Bundling requires registered atomic capabilities.
- Bundle certification requires composition validation.
- Platform composition requires certified or conditionally approved bundles.
- Platform certification requires complete composition evidence.

## Composition Replay Service

Service ID: `P1.4-COMP-RPL-SVC-001`

The Composition Replay Service reconstructs bundle and platform composition from recorded evidence.

Replay inputs:

- Composition registry records.
- Composition dependency graph.
- Atomic capability records.
- Bundle records.
- Platform records.
- Composition policies.
- Validation reports.
- Evidence manifests.

Replay outputs:

- Reconstructed composition graph.
- Reconstructed bundle membership.
- Reconstructed platform capability set.
- Ownership preservation report.
- Identity preservation report.
- Certification inheritance report.
- Replay hash.

Replay outcomes:

- `REPLAY_MATCH`
- `REPLAY_MISMATCH`
- `REPLAY_INCOMPLETE_EVIDENCE`
- `REPLAY_CYCLE_DETECTED`
- `REPLAY_REQUIRES_GOVERNANCE_REVIEW`

## Certification Inheritance

Inheritance model ID: `P1.4-CERT-INHERIT-001`

Composition may expose certification status from constituent capabilities, but it shall not collapse independent certification into bundle or platform identity.

Rules:

- Atomic certification remains attached to atomic identity.
- Bundle certification validates composition of included capabilities.
- Platform certification validates consumption, implementation boundary, and platform contracts.
- Certification inheritance shall be traceable to original evidence.
- Certification inheritance shall fail if constituent certification is missing, superseded, incompatible, or revoked.

## Validation Matrix

Validation matrix ID: `P1.4-COMP-VAL-MATRIX-001`

| Validation domain | Mechanism | Required result | Evidence |
| --- | --- | --- | --- |
| Atomic integrity | Atomic Capability Contract | One responsibility, no child capabilities | Atomic validation report |
| Bundle integrity | Bundle Contract | Registered atomic inclusions only | Bundle validation report |
| Platform integrity | Platform Contract | Consumed capabilities not redefined | Platform validation report |
| Dependency completeness | Dependency Graph | No hidden or orphaned dependencies | Dependency graph |
| Ownership preservation | Validation Engine | Atomic owners preserved | Ownership validation |
| Identity uniqueness | Registry | No duplicated identity | Identity validation |
| Lineage preservation | Composition Registry | Complete lineage | Lineage report |
| Replay reproducibility | Replay Service | Replay match | Replay report |

## Certification Decision

Decision ID: `P1.4-CERT-DEC-001`

Baseline decision: `PASS`

Rationale:

- Capability model is defined.
- Atomic capability contract is approved as the smallest constitutional unit.
- Bundle and platform composition contracts are defined.
- Composition constraints prohibit hidden, cyclic, duplicate, and identity-mutating composition.
- Composition evidence and replay requirements are defined.
- Certification inheritance remains traceable to atomic capability identity.

Restrictions:

- P1.4 certifies composition governance only.
- P1.4 does not certify runtime platform implementation.
- P1.4 does not permit bundles or platforms to own constituent atomic capabilities.

## Exit Criteria Mapping

| Exit criterion | Satisfying artifact | Status |
| --- | --- | --- |
| Capability model complete | `P1.4-CAP-MODEL-SPEC-001` | Defined |
| Atomic capability contract approved | `P1.4-ATOMIC-CONTRACT-001` | Defined |
| Bundle contract approved | `P1.4-BUNDLE-CONTRACT-001` | Defined |
| Platform composition defined | `P1.4-PLATFORM-COMP-CONTRACT-001` | Defined |
| Composition deterministic | `P1.4-COMP-VAL-ENG-001` | Defined |
| Ownership preserved | `P1.4-CERT-INHERIT-001` | Defined |
| Identity immutable | `P1.4-COMP-RULE-REG-001` | Defined |
| Dependency graph complete | `P1.4-COMP-DEP-GRAPH-001` | Defined |
| Lineage preserved | `P1.4-COMP-REG-001` | Defined |
| Composition replay validated | `P1.4-COMP-RPL-SVC-001` | Defined |
| Certification inheritance verified | `P1.4-CERT-INHERIT-001` | Defined |

## Summary

P1.4 establishes the constitutional model for atomic capabilities, capability bundles, and platforms.

It ensures composition is deterministic, evidence-producing, replayable, and identity-preserving while preventing hidden dependencies, duplicate capabilities, ownership reassignment, and implicit composition.
