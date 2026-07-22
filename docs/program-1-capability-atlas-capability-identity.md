# Program 1 - Capability Identity

Status: capability identity baseline

Program: Program 1 - Capability Atlas

Phase: P1.3 - Capability Identity

Predecessors:

- [Program 1 - Capability Atlas Bootstrap Instantiation](./program-1-capability-atlas-bootstrap-instantiation.md)
- [Program 1 - Capability Registration Foundation](./program-1-capability-atlas-registration-foundation.md)
- [Program 1 - Capability Discovery and Decomposition](./program-1-capability-atlas-discovery-decomposition.md)

## Purpose

P1.3 establishes the permanent constitutional identity of every capability within the Capability Atlas.

This phase defines immutable Capability IDs, governs namespace ownership, preserves aliases and historical names, records supersession and deprecation without rewriting history, reserves identity space for future expansion, and ensures every capability can be uniquely resolved throughout its lifecycle.

## Scope

P1.3 establishes:

- Capability Identity Contract.
- Capability ID Registry.
- ID Allocation Service.
- Reserved ID Registry.
- Namespace Registry.
- Alias Registry.
- Historical Identity Ledger.
- Identity Lineage Graph.
- Supersession Registry.
- Deprecation Registry.
- Identity Resolution Engine.
- Identity Validator.
- Identity Replay Service.
- Identity Certification Gate.

P1.3 does not establish:

- Capability discovery rules.
- Capability implementation.
- Capability qualification.
- Capability production certification.
- Runtime dependency approval.

## Constitutional Identity Principle

Capability identity is permanent.

A Capability ID, once issued, shall never change, never be reused, and never be deleted. Names, aliases, metadata, ownership stewardship, status, and replacement relationships may evolve only through governed records that preserve the original identity.

## Capability Identity Contract

Contract ID: `P1.3-ID-CONTRACT-001`

The Capability Identity Contract defines the constitutional rules governing capability identity.

Contract fields:

- Contract ID.
- Constitutional owner.
- Identity authority.
- Identity scope.
- ID allocation rules.
- Namespace governance rules.
- Alias rules.
- Historical identity rules.
- Supersession rules.
- Deprecation rules.
- Reserved ID rules.
- Resolution rules.
- Validation rules.
- Replay obligations.
- Evidence obligations.

Contract obligations:

- Capability IDs shall be immutable.
- Capability IDs shall be globally unique.
- Capability IDs shall never be reused.
- Capability IDs shall never change after issuance.
- Every namespace shall have exactly one constitutional owner.
- Aliases shall never replace canonical identities.
- Historical names shall remain permanently resolvable.
- Supersession shall never rewrite history.
- Deprecation shall never remove identity.
- Identity replay shall be deterministic.

## Identity Governance Rules

Governance registry ID: `P1.3-ID-GOV-REG-001`

| Rule ID | Rule | Enforcement |
| --- | --- | --- |
| `P1.3-ID-RULE-IMMUTABLE` | Issued Capability IDs cannot change. | Fail closed |
| `P1.3-ID-RULE-GLOBAL-UNIQUE` | Capability IDs are globally unique. | Fail closed |
| `P1.3-ID-RULE-NEVER-REUSE` | Retired, deprecated, superseded, and archived IDs cannot be reused. | Fail closed |
| `P1.3-ID-RULE-ONE-NS-OWNER` | Each namespace has one constitutional owner. | Fail closed |
| `P1.3-ID-RULE-ALIAS-HISTORICAL` | Historical aliases remain resolvable. | Fail closed |
| `P1.3-ID-RULE-SUPERSESSION-LINEAGE` | Replacement relationships preserve both identities. | Fail closed |
| `P1.3-ID-RULE-DEPRECATION-RETAINED` | Deprecated identities remain resolvable and replayable. | Fail closed |
| `P1.3-ID-RULE-RESERVED-PROTECTED` | Reserved IDs require constitutional approval before allocation. | Fail closed |

## Identity Lifecycle

Lifecycle ID: `P1.3-ID-LIFECYCLE-001`

```text
RESERVED
  -> ALLOCATED
  -> ACTIVE
  -> DEPRECATED
  -> SUPERSEDED
  -> ARCHIVED
```

Lifecycle rules:

- `RESERVED` protects an identity space before allocation.
- `ALLOCATED` indicates an ID has been issued but not yet active in downstream use.
- `ACTIVE` indicates the capability identity is current.
- `DEPRECATED` indicates the identity remains valid but is discouraged for new use.
- `SUPERSEDED` indicates a replacement capability is authoritative for future use.
- `ARCHIVED` indicates historical retention only.

No lifecycle transition removes identity.

## Capability ID Registry

Registry ID: `P1.3-CAP-ID-REG-001`

The Capability ID Registry stores globally unique, immutable identifiers for every capability.

Records:

- Capability ID.
- Namespace.
- Canonical name.
- Owner.
- Creation date.
- Allocation authority.
- Status.
- Version lineage.
- Reserved status.
- Supersession references.
- Deprecation references.
- Evidence references.
- Integrity hash.

Registry requirements:

- IDs shall be globally unique.
- IDs shall never be reused.
- Registry records shall be append-only.
- Status changes shall create ledger entries.
- Identity corrections shall require new records, not mutation.
- Registry state shall be replayable from evidence.

## ID Allocation Service

Service ID: `P1.3-ID-ALLOC-SVC-001`

The ID Allocation Service issues Capability IDs.

Allocation inputs:

- Validated capability candidate.
- Namespace reference.
- Owner reference.
- Registration request reference.
- Reserved ID claim when applicable.
- Allocation policy version.
- Evidence package.

Allocation outputs:

- Capability ID.
- Allocation decision.
- Allocation timestamp.
- Namespace binding.
- Owner binding.
- Identity hash.
- Evidence references.
- Replay references.

Allocation rules:

- Allocation shall be deterministic within namespace and policy version.
- Allocation shall fail when namespace ownership is unresolved.
- Allocation shall fail when owner authority is unresolved.
- Allocation shall fail when requested ID is reserved and not approved.
- Allocation shall fail when duplicate identity is detected.

## ID Validation Rules

Validation rules ID: `P1.3-ID-VAL-RULES-001`

Capability ID validation checks:

- Format conformance.
- Global uniqueness.
- Namespace conformance.
- Owner authority.
- Reserved ID compliance.
- Duplicate identity absence.
- Historical reuse prevention.
- Integrity hash correctness.
- Evidence completeness.

Validation outcomes:

- `VALID`
- `INVALID_FORMAT`
- `DUPLICATE_ID`
- `NAMESPACE_INVALID`
- `OWNER_INVALID`
- `RESERVED_ID_BLOCKED`
- `HISTORICAL_REUSE_BLOCKED`
- `EVIDENCE_INCOMPLETE`
- `REQUIRES_GOVERNANCE_REVIEW`

## Reserved ID Registry

Registry ID: `P1.3-RESERVED-ID-REG-001`

The Reserved ID Registry protects identity space for future, inherited, strategic, or constitutionally sensitive capabilities.

Records:

- Reserved ID or range.
- Namespace.
- Reservation authority.
- Reservation rationale.
- Reservation date.
- Expiration policy.
- Allocation constraints.
- Approval requirements.
- Evidence references.

Reserved IDs may never be allocated without constitutional approval.

## Namespace Registry

Registry ID: `P1.3-NS-REG-001`

The Namespace Registry governs ownership and allocation of capability namespaces.

Records:

- Namespace ID.
- Namespace code.
- Namespace name.
- Constitutional owner.
- Parent namespace.
- Delegation references.
- Reservation references.
- Inheritance rules.
- Active status.
- Transfer history.
- Evidence references.

Namespace rules:

- Every namespace has exactly one constitutional owner.
- Namespaces cannot overlap.
- Namespace ownership is deterministic.
- Namespace ownership transfers preserve lineage.
- Namespace delegation shall be explicit and evidence-bound.
- Namespace reservation shall block unauthorized allocation.

## Namespace Ownership Model

Ownership model ID: `P1.3-NS-OWN-MODEL-001`

Namespace ownership grants authority to:

- Allocate Capability IDs within the namespace.
- Approve aliases scoped to the namespace.
- Govern namespace delegation.
- Reserve namespace identity space.
- Approve namespace transfers.
- Maintain namespace lineage.

Namespace ownership does not grant authority to mutate already issued Capability IDs.

## Namespace Validation Service

Service ID: `P1.3-NS-VAL-SVC-001`

The Namespace Validation Service verifies namespace ownership and allocation authority.

Validation checks:

- Namespace exists.
- Namespace is active.
- Namespace has one owner.
- Namespace does not overlap with another namespace.
- Namespace hierarchy is valid.
- Delegation is valid.
- Reservation constraints are satisfied.
- Transfer lineage is complete.

## Alias Registry

Registry ID: `P1.3-ALIAS-REG-001`

The Alias Registry preserves historical capability names without changing identity.

Records:

- Alias.
- Canonical Capability ID.
- Effective start date.
- Effective end date.
- Historical reference.
- Replacement reason.
- Alias type.
- Approval reference.
- Evidence references.

Alias types:

- Historical name.
- Common name.
- Imported name.
- Legacy name.
- Superseded name.
- Migration name.
- External reference name.

Aliases never replace canonical identities.

## Alias Resolution Engine

Engine ID: `P1.3-ALIAS-RES-ENG-001`

The Alias Resolution Engine maps aliases and historical names to canonical Capability IDs.

Resolution rules:

- Alias resolution shall be deterministic.
- Effective dates shall be considered.
- Ambiguous aliases shall require governance review.
- Historical aliases shall remain permanently resolvable.
- Alias resolution shall preserve replay compatibility.
- Alias conflicts shall not mutate canonical identity.

Resolution outcomes:

- `RESOLVED_TO_CANONICAL_ID`
- `RESOLVED_TO_HISTORICAL_ID`
- `AMBIGUOUS_ALIAS`
- `ALIAS_NOT_FOUND`
- `ALIAS_REQUIRES_GOVERNANCE_REVIEW`

## Alias History Ledger

Ledger ID: `P1.3-ALIAS-HIST-LEDGER-001`

The Alias History Ledger records all alias additions, changes, conflicts, retirements, and resolutions.

Ledger entries:

- Alias event ID.
- Alias.
- Canonical Capability ID.
- Prior alias state.
- New alias state.
- Effective date.
- Actor.
- Authority reference.
- Evidence references.
- Integrity hash.

## Historical Identity Ledger

Ledger ID: `P1.3-HIST-ID-LEDGER-001`

The Historical Identity Ledger maintains complete historical identity lineage across capability evolution.

Preserved records:

- Original names.
- Renamed capabilities.
- Retired identities.
- Identity lineage.
- Historical references.
- Import references.
- Migration references.
- Supersession references.
- Deprecation references.
- Replay references.

Constitutional rules:

- Identity history is immutable.
- Historical identity is never deleted.
- Every identity transition preserves lineage.
- Historical references remain resolvable.

## Identity Lineage Graph

Graph ID: `P1.3-ID-LIN-GRAPH-001`

The Identity Lineage Graph records relationships among capability identities.

Relationship types:

- `ORIGINATED_FROM`
- `RENAMED_AS_ALIAS`
- `IMPORTED_FROM`
- `MIGRATED_FROM`
- `SUPERSEDES`
- `SUPERSEDED_BY`
- `MERGED_FROM`
- `SPLIT_FROM`
- `DEPRECATED_BY_POLICY`
- `ARCHIVED_AS`

Graph rules:

- Graph nodes are immutable identity records.
- Graph edges are append-only lineage records.
- Graph traversal shall support historical replay.
- Supersession and merge relationships shall preserve all source identities.

## Historical Name Registry

Registry ID: `P1.3-HIST-NAME-REG-001`

The Historical Name Registry stores prior names and name-like references.

Records:

- Historical name.
- Canonical Capability ID.
- Historical period.
- Source artifact.
- Reason for replacement.
- Alias reference.
- Evidence references.

Historical names are retained to support audit, replay, migration, and user-facing compatibility.

## Identity Replay Service

Service ID: `P1.3-ID-RPL-SVC-001`

The Identity Replay Service reconstructs identity resolution and lifecycle outcomes using recorded evidence.

Replay inputs:

- Capability ID Registry records.
- Namespace Registry records.
- Alias Registry records.
- Historical Identity Ledger entries.
- Supersession Registry records.
- Deprecation Registry records.
- Validation rule versions.
- Identity resolution engine version.
- Evidence manifests.

Replay outputs:

- Reconstructed identity state.
- Reconstructed namespace ownership.
- Reconstructed alias resolution.
- Reconstructed supersession path.
- Reconstructed deprecation state.
- Replay hash.
- Replay result.

Replay result values:

- `REPLAY_MATCH`
- `REPLAY_MISMATCH`
- `REPLAY_INCOMPLETE_EVIDENCE`
- `REPLAY_RULE_VERSION_MISSING`
- `REPLAY_AMBIGUOUS_IDENTITY`
- `REPLAY_REQUIRES_GOVERNANCE_REVIEW`

## Supersession Registry

Registry ID: `P1.3-SUPERSESSION-REG-001`

The Supersession Registry governs capability replacement while preserving immutable identity lineage.

Records:

- Supersession ID.
- Superseded capability.
- Replacement capability.
- Effective date.
- Rationale.
- Compatibility guidance.
- Evidence.
- Approval.
- Replay references.

Constitutional rules:

- Supersession never rewrites history.
- Superseded capabilities remain permanently identifiable.
- Replacement relationships are explicit.
- Lineage remains continuous.
- Supersession does not reuse the superseded Capability ID.

## Supersession Policy

Policy ID: `P1.3-SUPERSESSION-POL-001`

Supersession is permitted when:

- A capability is replaced by a more authoritative capability.
- A composite capability is replaced by atomic capabilities.
- A migrated identity is replaced by a canonical identity.
- A deprecated capability receives an approved successor.
- A governance decision requires replacement.

Supersession requires:

- Replacement validation.
- Owner approval.
- Namespace authority validation.
- Evidence package.
- Compatibility guidance.
- Lineage update.
- Replay validation.

## Replacement Validation Service

Service ID: `P1.3-REPLACE-VAL-SVC-001`

The Replacement Validation Service confirms supersession integrity.

Validation checks:

- Superseded capability exists.
- Replacement capability exists.
- Replacement relationship is approved.
- Effective date is valid.
- Rationale is recorded.
- Compatibility guidance is recorded.
- Lineage graph is updated.
- Historical references remain resolvable.

## Deprecation Registry

Registry ID: `P1.3-DEPRECATION-REG-001`

The Deprecation Registry governs capability retirement without removing constitutional identity.

Records:

- Deprecation ID.
- Capability ID.
- Deprecation state.
- Effective date.
- Deprecation rationale.
- Replacement reference.
- Compatibility guidance.
- Owner approval.
- Evidence references.
- Replay references.

Deprecation states:

```text
ACTIVE
  -> DEPRECATED
  -> SUPERSEDED
  -> ARCHIVED
```

Deprecation rules:

- Deprecation never removes identity.
- Deprecated capabilities remain resolvable.
- Historical references remain valid.
- Archived capabilities remain replayable.
- Deprecation does not imply deletion.

## Deprecation Policy

Policy ID: `P1.3-DEPRECATION-POL-001`

Deprecation may occur when:

- Capability use is discouraged.
- Replacement exists.
- Capability is obsolete.
- Capability is split or merged.
- Capability is retained for historical replay only.

Deprecation requires:

- Owner approval.
- Effective date.
- Compatibility guidance.
- Historical identity preservation.
- Evidence record.
- Replay validation.

## Identity Resolution Engine

Engine ID: `P1.3-ID-RES-ENG-001`

The Identity Resolution Engine resolves Capability IDs, aliases, historical names, and supersession paths.

Supported inputs:

- Capability ID.
- Alias.
- Historical name.
- Deprecated ID.
- Superseded ID.
- External migration reference.

Resolution outputs:

- Canonical Capability ID.
- Identity status.
- Namespace.
- Owner.
- Alias match.
- Supersession path.
- Deprecation state.
- Historical references.
- Evidence references.

Resolution shall be deterministic for identical inputs and policy versions.

## Identity Validator

Validator ID: `P1.3-ID-VALIDATOR-001`

The Identity Validator confirms all capability identities remain constitutionally valid.

Validation checks:

- ID uniqueness.
- Alias consistency.
- Namespace ownership.
- Namespace hierarchy.
- Supersession integrity.
- Deprecation lifecycle.
- Historical lineage.
- Reserved ID compliance.
- Replay reproducibility.
- Evidence completeness.

## Duplicate Detection Service

Service ID: `P1.3-ID-DUP-SVC-001`

The Duplicate Detection Service prevents identity duplication.

Detection checks:

- Duplicate Capability IDs.
- Duplicate canonical identity claims.
- Duplicate aliases.
- Historical name collisions.
- Namespace overlap.
- Reserved ID conflicts.
- Supersession loops.

Identity duplicates shall fail closed until resolved by governance.

## Identity Integrity Report

Report ID: `P1.3-ID-INTEGRITY-RPT-001`

The Identity Integrity Report summarizes identity health.

Report sections:

- Global ID uniqueness.
- Namespace ownership status.
- Alias resolution status.
- Historical identity completeness.
- Supersession integrity.
- Deprecation lifecycle status.
- Reserved ID compliance.
- Duplicate findings.
- Replay validation.
- Open governance exceptions.

## Identity Evidence Repository

Repository ID: `P1.3-ID-EVID-REPO-001`

The Identity Evidence Repository stores artifacts supporting identity decisions.

Artifact classes:

- ID allocation evidence.
- Namespace ownership evidence.
- Alias approval evidence.
- Historical identity evidence.
- Supersession evidence.
- Deprecation evidence.
- Reserved ID approval evidence.
- Identity validation reports.
- Replay validation reports.
- Certification decision records.

Artifacts shall be immutable, content-addressable, and lineage-bound.

## Identity Certification Gate

Gate ID: `P1.3-ID-CERT-GATE-001`

The Identity Certification Gate certifies that capability identities satisfy constitutional identity requirements before downstream capability governance proceeds.

Certification outcomes:

- `PASS`
- `CONDITIONAL_PASS`
- `FAIL`

Certification requires:

- Capability ID Registry.
- Namespace Registry.
- Alias Registry.
- Historical Identity Ledger.
- Supersession Registry.
- Deprecation Registry.
- Identity Validation Report.
- Identity Integrity Report.
- Identity Replay Validation.
- Certification Decision Record.

## Certification Test Matrix

Test matrix ID: `P1.3-ID-CERT-TEST-MATRIX-001`

| Test | Expected |
| --- | --- |
| Every capability assigned immutable ID | PASS |
| Capability IDs globally unique | PASS |
| Reserved IDs protected | PASS |
| Namespace ownership deterministic | PASS |
| Alias resolution deterministic | PASS |
| Historical names preserved | PASS |
| Supersession lineage complete | PASS |
| Deprecation lifecycle governed | PASS |
| Identity replay reproducible | PASS |
| Identity lineage immutable | PASS |

## Validation Matrix

Validation matrix ID: `P1.3-ID-VAL-MATRIX-001`

| Domain | Mechanism | Required result | Evidence |
| --- | --- | --- | --- |
| ID uniqueness | Capability ID Registry | No duplicates | ID validation report |
| ID allocation | ID Allocation Service | Deterministic allocation | Allocation evidence |
| Reserved IDs | Reserved ID Registry | Protected or approved | Reserved ID report |
| Namespace ownership | Namespace Registry | One owner per namespace | Namespace validation report |
| Alias preservation | Alias Registry | Historical names resolvable | Alias resolution report |
| Historical lineage | Historical Identity Ledger | Complete lineage | Lineage report |
| Supersession | Supersession Registry | Replacement explicit | Supersession report |
| Deprecation | Deprecation Registry | Lifecycle governed | Deprecation report |
| Resolution | Identity Resolution Engine | Deterministic result | Resolution report |
| Replay | Identity Replay Service | Replay match | Replay report |

## Compliance Matrix

Compliance matrix ID: `P1.3-ID-COMP-MATRIX-001`

| Constitutional requirement | Satisfying artifact | Status |
| --- | --- | --- |
| Immutable identity defined | `P1.3-ID-CONTRACT-001` | Defined |
| Globally unique IDs governed | `P1.3-CAP-ID-REG-001` | Defined |
| ID allocation deterministic | `P1.3-ID-ALLOC-SVC-001` | Defined |
| Reserved IDs protected | `P1.3-RESERVED-ID-REG-001` | Defined |
| Namespace ownership governed | `P1.3-NS-REG-001` | Defined |
| Aliases preserved | `P1.3-ALIAS-REG-001` | Defined |
| Historical identity immutable | `P1.3-HIST-ID-LEDGER-001` | Defined |
| Supersession lineage preserved | `P1.3-SUPERSESSION-REG-001` | Defined |
| Deprecation retains identity | `P1.3-DEPRECATION-REG-001` | Defined |
| Identity resolution deterministic | `P1.3-ID-RES-ENG-001` | Defined |
| Identity replay reproducible | `P1.3-ID-RPL-SVC-001` | Defined |

## Exit Criteria Mapping

| Exit criterion | Satisfying artifact | Status |
| --- | --- | --- |
| Every capability identified | `P1.3-CAP-ID-REG-001` | Defined |
| IDs immutable | `P1.3-ID-CONTRACT-001` | Defined |
| Aliases preserved | `P1.3-ALIAS-REG-001` | Defined |
| Identity deterministic | `P1.3-ID-RES-ENG-001` | Defined |
| Namespace ownership validated | `P1.3-NS-VAL-SVC-001` | Defined |
| Historical lineage complete | `P1.3-HIST-ID-LEDGER-001` | Defined |
| Replay reproducible | `P1.3-ID-RPL-SVC-001` | Defined |
| Capability identity certified | `P1.3-ID-CERT-GATE-001` | Defined |

## Certification Decision

Decision ID: `P1.3-CERT-DEC-001`

Baseline decision: `PASS`

Rationale:

- Capability Identity Contract is defined.
- Capability ID Registry and allocation controls are defined.
- Reserved IDs and namespace ownership are governed.
- Alias and historical identity preservation are defined.
- Supersession and deprecation preserve immutable identity.
- Identity resolution and replay are deterministic.
- Certification test matrix satisfies constitutional identity requirements.

Restrictions:

- P1.3 certifies identity governance only.
- P1.3 does not certify capability qualification.
- P1.3 does not certify capability implementation.
- P1.3 does not authorize production use.
- P1.3 does not permit identity mutation after issuance.

## Downstream Handoff

P1.3 authorizes downstream phases to consume:

- Immutable Capability IDs.
- Namespace ownership records.
- Alias resolution records.
- Historical identity records.
- Supersession relationships.
- Deprecation states.
- Identity validation reports.
- Identity replay references.
- Identity certification decision.

Downstream phases shall reference capabilities by immutable Capability ID and shall not redefine canonical identity semantics.

## Summary

P1.3 establishes permanent constitutional identity for Capability Atlas records.

It defines the identity contract, ID registry, allocation service, namespace registry, alias registry, historical identity ledger, supersession and deprecation governance, identity resolution, validation, replay, and certification gate required to make capability identity unique, immutable, resolvable, and replayable across the Civitas ecosystem.
