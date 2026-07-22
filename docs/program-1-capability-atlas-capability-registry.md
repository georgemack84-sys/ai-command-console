# Program 1 - Capability Registry

Status: capability registry baseline

Program: Program 1 - Capability Atlas

Phase: P1.6 - Capability Registry

Predecessors:

- [Program 1 - Capability Atlas Bootstrap Instantiation](./program-1-capability-atlas-bootstrap-instantiation.md)
- [Program 1 - Capability Registration Foundation](./program-1-capability-atlas-registration-foundation.md)
- [Program 1 - Capability Discovery and Decomposition](./program-1-capability-atlas-discovery-decomposition.md)
- [Program 1 - Capability Identity](./program-1-capability-atlas-capability-identity.md)
- [Program 1 - Capability Model and Composition](./program-1-capability-atlas-model-composition.md)
- [Program 1 - Atlas Schema Governance](./program-1-capability-atlas-schema-governance.md)

## Purpose

P1.6 establishes the authoritative constitutional registry for every capability defined within the Capability Atlas.

The Capability Registry is the immutable source of truth for capability identity, ownership, lifecycle, governance status, composition eligibility, relationships, qualification, certification, discovery, traceability, and historical lineage.

## Scope

The registry governs:

- Atomic capabilities.
- Capability bundles.
- Platforms.
- Constitutional framework capabilities.
- Shared infrastructure capabilities.
- Operational capabilities.
- Governance capabilities.
- Certification capabilities.
- Evidence capabilities.
- Replay capabilities.

## Capability Registry

Registry ID: `P1.6-CAP-REG-001`

The Capability Registry registers every approved capability exactly once.

Registry obligations:

- Register every approved capability exactly once.
- Establish immutable capability records.
- Preserve complete identity lineage.
- Maintain constitutional ownership.
- Support deterministic discovery.
- Enable governance validation.
- Support certification replay.
- Provide authoritative references for downstream programs.
- Eliminate duplicate capability definitions.
- Preserve historical evolution without rewriting records.

## Registry Schema

Schema ID: `P1.6-REG-SCHEMA-001`

Every capability record contains:

Identity:

- Capability ID.
- Canonical name.
- Namespace.
- Capability type.
- Version.
- Immutable identity hash.

Ownership:

- Constitutional owner.
- Responsible program.
- Steward.
- Governance authority.
- Ownership history.

Lifecycle:

- Registration date.
- Current status.
- Previous status.
- Supersession reference.
- Deprecation reference.
- Retirement eligibility.

Relationships:

- Parent capability.
- Child capabilities.
- Dependencies.
- Dependents.
- Extension points.
- Bundle membership.
- Platform membership.

Governance:

- Qualification status.
- Certification status.
- Evidence references.
- Governance decisions.
- Applicable policies.
- Constitutional framework references.

Traceability:

- Discovery record.
- Identity record.
- Qualification record.
- Certification record.
- Validation history.
- Replay references.

## Capability States

State model ID: `P1.6-CAP-STATE-MODEL-001`

```text
DISCOVERED
  -> CANDIDATE
  -> REGISTERED
  -> QUALIFIED
  -> CERTIFIED
  -> ACTIVE
  -> SUPERSEDED
  -> DEPRECATED
  -> ARCHIVED
```

History remains immutable.

State transitions shall be deterministic, evidence-producing, policy-bound, and replayable.

## Capability Registration Service

Service ID: `P1.6-CAP-REG-SVC-001`

The Capability Registration Service writes newly approved capabilities into the authoritative registry.

Functions:

- Identity verification.
- Duplicate detection.
- Ownership validation.
- Namespace validation.
- Registration approval.
- Immutable persistence.
- Event emission.
- Evidence binding.

Service constraints:

- Registration shall occur only after identity validation.
- A capability shall be registered exactly once.
- Registration shall preserve immutable lineage.
- Registration shall not rewrite existing records.

## Registry Query Service

Service ID: `P1.6-REG-QRY-SVC-001`

The Registry Query Service supports deterministic lookup.

Supported queries:

- By Capability ID.
- By namespace.
- By owner.
- By platform.
- By framework.
- By lifecycle.
- By qualification.
- By certification.
- By dependency.
- By relationship.

Query rules:

- Queries shall distinguish current state from history.
- Queries shall return evidence references.
- Queries shall preserve access policy.
- Queries shall resolve aliases through identity governance.

## Capability State Registry

Registry ID: `P1.6-CAP-STATE-REG-001`

The Capability State Registry records lifecycle state history.

Fields:

- Capability ID.
- Prior state.
- New state.
- Transition reason.
- Authority reference.
- Evidence references.
- Timestamp.
- Integrity hash.

## Ownership Registry

Registry ID: `P1.6-OWN-REG-001`

The Ownership Registry records constitutional capability ownership.

Fields:

- Capability ID.
- Constitutional owner.
- Steward.
- Responsible program.
- Governance authority.
- Ownership history.
- Transfer references.
- Evidence references.

Ownership rules:

- Ownership is constitutionally unique.
- Ownership transfer preserves historical ownership.
- Bundles and platforms do not own constituent atomic capabilities.

## Lifecycle Registry

Registry ID: `P1.6-LIFECYCLE-REG-001`

The Lifecycle Registry records lifecycle events and state transitions.

Lifecycle events:

- Discovery.
- Candidate promotion.
- Registration.
- Qualification.
- Certification.
- Activation.
- Supersession.
- Deprecation.
- Archival.

## Registry Validation Engine

Engine ID: `P1.6-REG-VAL-ENG-001`

The Registry Validation Engine validates:

- Identity integrity.
- Ownership integrity.
- Namespace uniqueness.
- Lifecycle consistency.
- Dependency integrity.
- Relationship integrity.
- Governance compliance.
- Certification consistency.
- Evidence completeness.

Validation outcomes:

- `VALID`
- `DUPLICATE_REGISTRATION`
- `IDENTITY_INVALID`
- `OWNER_INVALID`
- `NAMESPACE_INVALID`
- `LIFECYCLE_INVALID`
- `RELATIONSHIP_INVALID`
- `GOVERNANCE_NONCOMPLIANT`
- `CERTIFICATION_INCONSISTENT`
- `EVIDENCE_INCOMPLETE`

## Registry Event Ledger

Ledger ID: `P1.6-REG-EVT-LEDGER-001`

The registry records immutable events for:

- Registration.
- Qualification.
- Certification.
- Activation.
- Supersession.
- Ownership transfer.
- Alias addition.
- Namespace reservation.
- Deprecation.
- Archival.

Ledger rules:

- All events are immutable.
- Event order is deterministic.
- Registry state is derived from event history.
- Events bind to evidence and replay references.

## Registry Replay Service

Service ID: `P1.6-REG-RPL-SVC-001`

The Registry Replay Service supports replay of:

- Registrations.
- Updates.
- Ownership transitions.
- Supersession.
- Certification.
- Qualification.
- Governance decisions.

Replay shall reproduce identical registry state from recorded evidence.

Replay outcomes:

- `REPLAY_MATCH`
- `REPLAY_MISMATCH`
- `REPLAY_INCOMPLETE_EVIDENCE`
- `REPLAY_SCHEMA_VERSION_MISSING`
- `REPLAY_POLICY_VERSION_MISSING`
- `REPLAY_REQUIRES_GOVERNANCE_REVIEW`

## Registry Snapshot Service

Service ID: `P1.6-REG-SNAPSHOT-SVC-001`

The Registry Snapshot Service produces immutable snapshots for:

- Certification.
- Audit.
- Governance.
- Migration.
- Rollback.
- Replay.

Snapshot fields:

- Snapshot ID.
- Registry version.
- Snapshot timestamp.
- Included records.
- Schema versions.
- Policy versions.
- Event ledger range.
- Evidence manifest.
- Integrity hash.

Snapshots are versioned and immutable.

## Constitutional Rules

Rule registry ID: `P1.6-REG-RULE-REG-001`

- Every capability shall possess one immutable registry identity.
- A capability shall be registered exactly once.
- Registration shall occur only after identity validation.
- Registration shall preserve immutable lineage.
- Registry records shall never be rewritten.
- Historical registry entries shall remain permanently accessible.
- Ownership shall be constitutionally unique.
- Capabilities shall not exist outside the registry.
- Bundles reference registered capabilities but never duplicate them.
- Platforms reference registered capabilities but never redefine them.
- Supersession preserves complete lineage.
- Aliases never replace canonical identities.
- Every registry modification shall generate immutable evidence.
- Registry replay shall always reproduce identical results.
- Certification references immutable registry records.

## Evidence Produced

Evidence model ID: `P1.6-REG-EVID-MODEL-001`

The registry produces:

- Registration evidence.
- Identity validation evidence.
- Namespace validation evidence.
- Ownership validation evidence.
- Governance evidence.
- Qualification evidence.
- Certification evidence.
- Replay evidence.
- Audit evidence.

## Registry Certification Package

Package ID: `P1.6-REG-CERT-PKG-001`

The Registry Certification Package contains:

- Registry schema.
- Registry validation report.
- Registry event ledger report.
- Registry replay report.
- Registry snapshot report.
- Identity integrity report.
- Ownership integrity report.
- Lifecycle integrity report.
- Relationship integrity report.
- Evidence completeness report.
- Certification decision record.

## Dependency Model

Dependency model ID: `P1.6-DEP-MODEL-001`

P1.6 depends on:

- P1.0 Capability Atlas Bootstrap Instantiation.
- P1.1 Capability Registration Foundation.
- P1.2 Capability Discovery and Decomposition.
- P1.3 Capability Identity.
- P1.4 Capability Model and Composition.
- P1.5 Atlas Schema Governance.

P1.6 provides foundational services for:

- Program 2 - Civitas Core Infrastructure.
- Platform Capability Discovery.
- Constitutional Intake Framework.
- Certification Framework.
- Capability Composition.
- Capability Resolution.
- Platform Architecture.
- Mission Control.

## Validation Matrix

Validation matrix ID: `P1.6-REG-VAL-MATRIX-001`

| Domain | Mechanism | Required result | Evidence |
| --- | --- | --- | --- |
| Registration uniqueness | Capability Registry | Registered exactly once | Registry validation report |
| Identity integrity | Registry Validation Engine | Immutable identity valid | Identity validation evidence |
| Ownership integrity | Ownership Registry | Unique owner | Ownership validation evidence |
| Namespace validity | Registry Validation Engine | Namespace valid | Namespace validation evidence |
| Lifecycle consistency | Lifecycle Registry | Valid transition history | Lifecycle report |
| Relationship integrity | Registry Schema | Relationships valid | Relationship report |
| Governance compliance | Validation Engine | Policies satisfied | Governance evidence |
| Certification consistency | Certification refs | Immutable references valid | Certification evidence |
| Replay reproducibility | Replay Service | Replay match | Replay report |
| Snapshot reproducibility | Snapshot Service | Snapshot integrity valid | Snapshot report |

## Certification Decision

Decision ID: `P1.6-CERT-DEC-001`

Baseline decision: `PASS`

Rationale:

- Authoritative Capability Registry is defined.
- Registry schema covers identity, ownership, lifecycle, relationships, governance, and traceability.
- Registry services support registration, query, validation, replay, and snapshots.
- Registry events are immutable.
- Registry records are never rewritten.
- Duplicate registration is prohibited.
- Certification references immutable registry records.

Restrictions:

- P1.6 certifies the registry model and governance baseline.
- P1.6 does not certify every future capability record automatically.
- P1.6 does not authorize capabilities outside the registry.

## Exit Criteria Mapping

| Exit criterion | Satisfying artifact | Status |
| --- | --- | --- |
| Every capability registered | `P1.6-CAP-REG-001` | Defined |
| Registry deterministic | `P1.6-REG-EVT-LEDGER-001` | Defined |
| Identities immutable | `P1.6-REG-SCHEMA-001` | Defined |
| Ownership unique | `P1.6-OWN-REG-001` | Defined |
| Lifecycle governed | `P1.6-LIFECYCLE-REG-001` | Defined |
| Lineage complete | `P1.6-REG-EVT-LEDGER-001` | Defined |
| Namespaces validated | `P1.6-REG-VAL-ENG-001` | Defined |
| Duplicate registration impossible | `P1.6-CAP-REG-SVC-001` | Defined |
| Replay reproducible | `P1.6-REG-RPL-SVC-001` | Defined |
| Governance enforced | `P1.6-REG-RULE-REG-001` | Defined |
| Certification references complete | `P1.6-REG-CERT-PKG-001` | Defined |
| Registry snapshots reproducible | `P1.6-REG-SNAPSHOT-SVC-001` | Defined |
| Audit evidence complete | `P1.6-REG-EVID-MODEL-001` | Defined |
| Registry certified | `P1.6-CERT-DEC-001` | Defined |

## Summary

P1.6 establishes the Capability Registry as the authoritative constitutional source of truth for every Atlas capability.

It defines immutable registry records, schema, services, lifecycle, ownership, validation, event ledger, replay, snapshots, evidence, certification package, and downstream service obligations.
