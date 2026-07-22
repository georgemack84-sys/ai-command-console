# Program 1 - Layer 0 Constitutional Version Governance

Status: constitutional version governance baseline

Program: Program 1 - Capability Atlas

Layer: Layer 0 - Constitutional Foundation

Phase: L0.4 - Constitutional Version Governance

Predecessors:

- [Program 1 - Layer 0 Constitutional Contract](./program-1-layer-0-constitutional-contract.md)
- [Program 1 - Layer 0 Constitutional Governance](./program-1-layer-0-constitutional-governance.md)
- [Program 1 - Layer 0 Constitutional Amendment Framework](./program-1-layer-0-constitutional-amendment-framework.md)
- [Program 1 - Layer 0 Constitutional Framework Governance](./program-1-layer-0-constitutional-framework-governance.md)
- [VPR.12 - Certification Gate](./vpr-12-certification-gate.md)

## Purpose

L0.4 establishes the constitutional governance model for the evolution of the Civitas Constitution by providing deterministic version control, compatibility management, immutable lineage, and replayable version history.

This phase ensures constitutional versions evolve without rewriting history while preserving compatibility, traceability, governance authority, and replay across all constitutional artifacts.

## Objectives

L0.4 establishes:

- Constitutional version lifecycle.
- Activation and retirement governance.
- Immutable constitutional lineage.
- Compatibility validation between constitutional versions.
- Prevention of unsupported constitutional forks.
- Deterministic constitutional replay across versions.
- Evidence for every constitutional version transition.
- Certification of version identity, lifecycle, compatibility, lineage, replay, evidence, and governance compliance.

## Constitutional Scope

L0.4 governs only constitutional version governance.

It governs:

- Constitutional version identity.
- Version lifecycle.
- Version compatibility.
- Version activation.
- Version supersession.
- Version lineage.
- Version replay.
- Version evidence.
- Version audit.

It does not govern:

- Constitutional amendment workflow, governed by L0.2.
- Constitutional framework ownership, governed by L0.3.
- Program-specific versioning.
- Implementation versioning.
- Application releases.

Scope boundary rules:

- Version governance shall not become an alternate amendment workflow.
- Program releases shall not define constitutional versions.
- Implementation releases shall not alter constitutional version state.
- Constitutional version state changes require Layer 0 authority and immutable evidence.

## Constitutional Authority

Layer 0 is the exclusive authority governing constitutional versions.

No program may:

- Define independent constitutional versions.
- Bypass constitutional version governance.
- Fork constitutional history.
- Redefine constitutional lifecycle states.
- Activate a constitutional version outside Layer 0.
- Treat a program release as a constitutional version.

Programs inherit the currently `ACTIVE` constitutional version from Layer 0 without modification.

## Layer 0 Version Registry

Registry ID: `P1-L0.4-VER-REG-001`

The Layer 0 Version Registry is the authoritative registry of every constitutional version.

Registry record fields:

```text
constitutional_version_id
constitutional_version_name
version_number
version_status
constitutional_scope
ratification_ref
activation_ref
supersession_ref
archival_ref
compatibility_refs
lineage_refs
evidence_refs
replay_refs
integrity_hash
```

| Version ID | Version | Scope | Status | Ratification | Activation | Supersession | Compatibility refs | Replay |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1-L0.4-VER-001 | Civitas Constitution Baseline | Layer 0 constitutional foundation | ACTIVE | P1-L0.4-RAT-001 | P1-L0.4-ACT-001 | None | P1-L0.4-COMP-001 | P1-L0.4-RPL-001 |
| P1-L0.4-VER-002 | Civitas Constitution Successor Slot | Future constitutionally ratified successor | DRAFT | Pending | Pending | Pending | P1-L0.4-COMP-PENDING | Pending |

Registry rules:

- Every constitutional version has a globally unique immutable identity.
- Version identifiers are never reused.
- Only one constitutional version may be `ACTIVE` at any time.
- `ACTIVE`, `SUPERSEDED`, and `ARCHIVED` version records are immutable.
- Corrections create superseding records and do not rewrite registry history.

## Version Lifecycle

Every constitutional version progresses through the deterministic lifecycle:

```text
DRAFT
  -> PROPOSED
  -> RATIFIED
  -> ACTIVE
  -> SUPERSEDED
  -> ARCHIVED
```

Lifecycle state definitions:

| State | Definition | Characteristics | Permitted transitions |
| --- | --- | --- | --- |
| DRAFT | Version is under development. | Editable, not authoritative, not certifiable, not deployable. | PROPOSED |
| PROPOSED | Version has entered constitutional review. | Frozen for review, governance evaluation active, evidence collection active, replay validation pending. | RATIFIED or DRAFT |
| RATIFIED | Version has been constitutionally approved. | Immutable, approved, activation eligible, certifiable. | ACTIVE or ARCHIVED |
| ACTIVE | Version is the governing constitutional authority. | Authoritative, inherited by programs, replay reference, certification baseline. | SUPERSEDED |
| SUPERSEDED | Newer constitutional version has become active. | Immutable, historical authority preserved, replay supported, certification lineage retained. | ARCHIVED |
| ARCHIVED | Historical preservation state. | Immutable, replayable, non-authoritative, permanently preserved. | None |

Lifecycle transition record fields:

```text
transition_id
constitutional_version_id
previous_state
new_state
governing_authority
ratification_reference
activation_reference
compatibility_decision_ref
evidence_refs
timestamp
replay_reference
integrity_hash
```

Timestamp rule:

- Timestamps are evidentiary metadata only.
- Timestamps shall not determine version precedence, activation authority, compatibility, replay ordering, or constitutional validity.

## Compatibility Registry

Registry ID: `P1-L0.4-COMP-REG-001`

The Compatibility Registry determines constitutional compatibility between versions.

Compatibility categories:

- `FULLY_COMPATIBLE`
- `FORWARD_COMPATIBLE`
- `BACKWARD_COMPATIBLE`
- `REPLAY_COMPATIBLE`
- `CERTIFICATION_COMPATIBLE`
- `MIGRATION_REQUIRED`
- `INCOMPATIBLE`
- `UNKNOWN`

Compatibility record fields:

```text
compatibility_id
source_version_ref
target_version_ref
compatibility_category
forward_compatibility
backward_compatibility
amendment_dependency_refs
inheritance_compatibility
migration_eligibility
replay_compatibility
certification_compatibility
evidence_refs
decision_rationale
integrity_hash
```

| Compatibility ID | Source version | Target version | Category | Forward | Backward | Replay | Certification | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1-L0.4-COMP-001 | P1-L0.4-VER-001 | P1-L0.4-VER-001 | FULLY_COMPATIBLE | PASS | PASS | PASS | PASS | APPROVED |
| P1-L0.4-COMP-002 | P1-L0.4-VER-001 | P1-L0.4-VER-002 | UNKNOWN | FAIL_CLOSED | FAIL_CLOSED | PENDING | PENDING | NOT_APPROVED |

Compatibility rules:

- Compatibility decisions are deterministic.
- Unknown compatibility status fails closed.
- Every compatibility determination references immutable evidence.
- Compatibility cannot be inferred from version naming.
- Compatibility cannot be established without replay and certification compatibility checks.
- Migration eligibility requires amendment dependency and inheritance compatibility validation.

## Version Lineage Graph

Graph ID: `P1-L0.4-LIN-GRAPH-001`

The Version Lineage Graph maintains immutable ancestry for every constitutional version.

Lineage edge fields:

```text
lineage_id
parent_version_ref
successor_version_ref
amendment_refs
ratification_lineage_refs
activation_lineage_refs
supersession_lineage_refs
archival_lineage_refs
evidence_refs
replay_refs
integrity_hash
```

| Lineage ID | Parent version | Successor version | Amendment refs | Ratification lineage | Activation lineage | Supersession lineage | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1-L0.4-LIN-001 | None | P1-L0.4-VER-001 | P1-L0.2-AMD-* | P1-L0.4-RAT-001 | P1-L0.4-ACT-001 | None | ACTIVE |
| P1-L0.4-LIN-002 | P1-L0.4-VER-001 | P1-L0.4-VER-002 | Pending | Pending | Pending | Pending | DRAFT |

Lineage rules:

- Version lineage is immutable.
- Version history is never rewritten.
- Successor versions create new lineage edges.
- Supersession preserves predecessor replay and certification lineage.
- Archival preserves audit access and historical reconstruction.

## Version Ledger

Ledger ID: `P1-L0.4-VER-LEDGER-001`

The Version Ledger maintains the immutable audit history of constitutional versions.

Ledger event types:

- `CREATION`
- `PROPOSAL`
- `RATIFICATION`
- `ACTIVATION`
- `SUPERSESSION`
- `ARCHIVAL`
- `COMPATIBILITY_DECISION`

Ledger record fields:

```text
version_event_id
constitutional_version_id
event_type
previous_state
new_state
governing_authority
governance_decision_refs
compatibility_refs
lineage_refs
evidence_refs
replay_refs
integrity_hash
```

| Ledger ID | Version | Event type | Previous state | New state | Evidence | Replay |
| --- | --- | --- | --- | --- | --- | --- |
| P1-L0.4-VLED-001 | P1-L0.4-VER-001 | CREATION | None | DRAFT | P1-L0.4-EV-001 | P1-L0.4-RPL-001 |
| P1-L0.4-VLED-002 | P1-L0.4-VER-001 | PROPOSAL | DRAFT | PROPOSED | P1-L0.4-EV-002 | P1-L0.4-RPL-001 |
| P1-L0.4-VLED-003 | P1-L0.4-VER-001 | RATIFICATION | PROPOSED | RATIFIED | P1-L0.4-EV-003 | P1-L0.4-RPL-001 |
| P1-L0.4-VLED-004 | P1-L0.4-VER-001 | ACTIVATION | RATIFIED | ACTIVE | P1-L0.4-EV-004 | P1-L0.4-RPL-001 |
| P1-L0.4-VLED-005 | P1-L0.4-VER-001 | COMPATIBILITY_DECISION | ACTIVE | ACTIVE | P1-L0.4-EV-005 | P1-L0.4-RPL-002 |

Ledger rules:

- Every lifecycle transition generates immutable evidence.
- Ledger history is append-only.
- Ledger events preserve governance decision refs and replay refs.
- Compatibility decisions are ledgered.
- Supersession and archival events preserve historical authority.

## Version Replay Service

Replay service ID: `P1-L0.4-RPL-SVC-001`

Constitutional replay reconstructs the exact constitutional version that governed the original decision.

Replay profile fields:

```text
replay_id
constitutional_version_ref
ledger_event_refs
compatibility_refs
lineage_refs
evidence_refs
expected_constitutional_state
expected_active_version
replay_result
integrity_hash
```

| Replay ID | Replay scope | Version refs | Ledger refs | Expected outcome | Status |
| --- | --- | --- | --- | --- | --- |
| P1-L0.4-RPL-001 | Active baseline version replay | P1-L0.4-VER-001 | P1-L0.4-VLED-001 through P1-L0.4-VLED-004 | P1-L0.4-VER-001 ACTIVE | READY |
| P1-L0.4-RPL-002 | Compatibility decision replay | P1-L0.4-VER-001 | P1-L0.4-VLED-005 | FULLY_COMPATIBLE self-compatibility | READY |

Replay rules:

- Replay reproduces the exact constitutional version effective for a governed decision.
- `SUPERSEDED` versions remain replayable indefinitely.
- `ARCHIVED` versions remain permanently accessible for audit.
- Replay failure opens a new ledger event and does not modify history.

## Version Evidence Registry

Evidence record fields:

```text
evidence_id
version_ref
transition_ref
previous_state
new_state
governing_authority
ratification_ref
activation_ref
compatibility_decision_ref
timestamp
replay_ref
integrity_hash
```

| Evidence ID | Evidence | Version refs | Bound event | Integrity requirement |
| --- | --- | --- | --- | --- |
| P1-L0.4-EV-001 | Version creation evidence | P1-L0.4-VER-001 | P1-L0.4-VLED-001 | Version identity hash |
| P1-L0.4-EV-002 | Version proposal evidence | P1-L0.4-VER-001 | P1-L0.4-VLED-002 | Proposal state hash |
| P1-L0.4-EV-003 | Version ratification evidence | P1-L0.4-VER-001 | P1-L0.4-VLED-003 | Ratification and authority hash |
| P1-L0.4-EV-004 | Version activation evidence | P1-L0.4-VER-001 | P1-L0.4-VLED-004 | Activation and active-version hash |
| P1-L0.4-EV-005 | Compatibility decision evidence | P1-L0.4-VER-001 | P1-L0.4-VLED-005 | Compatibility decision hash |

Evidence rules:

- Every version transition produces immutable evidence.
- Evidence includes version identifier, previous state, new state, governing authority, ratification reference, activation reference, compatibility decision, timestamp, replay reference, and integrity hash.
- Evidence is mandatory for certification.

## Fork Prevention and Active-Version Control

Fork prevention rules:

- Constitutional versions shall never fork into multiple active constitutional authorities.
- Only one constitutional version may be `ACTIVE` simultaneously.
- Activation requires a check that no other constitutional version is `ACTIVE`, except the version being superseded in the same atomic transition.
- Unsupported forks fail certification.
- Program-defined constitutional versions are invalid and rejected.

Active-version validation:

| Validation ID | Validation | Expected | Failure outcome |
| --- | --- | --- | --- |
| P1-L0.4-ACT-VAL-001 | Version is RATIFIED before activation | PASS | ACTIVATION_REJECTED |
| P1-L0.4-ACT-VAL-002 | No concurrent ACTIVE version remains after activation | PASS | FORK_PREVENTION_FAILURE |
| P1-L0.4-ACT-VAL-003 | Activation evidence complete | PASS | CERTIFICATION_FAIL |
| P1-L0.4-ACT-VAL-004 | Programs inherit activated version unchanged | PASS | INHERITANCE_VIOLATION |

## Certification Requirements

L0.4 certifies:

- Version identity.
- Lifecycle determinism.
- Compatibility validation.
- Lineage integrity.
- Replay reproducibility.
- Evidence completeness.
- Governance compliance.
- Active-version uniqueness.
- Ratification-before-activation.
- Fork prevention.

Certification evidence:

- Version registry records.
- Compatibility registry records.
- Version lineage graph.
- Version ledger records.
- Replay profiles.
- Evidence registry records.
- Active-version validation records.

## Certification Test Matrix

| Test ID | Test | Expected | Evidence | Result |
| --- | --- | --- | --- | --- |
| P1-L0.4-TST-001 | Version identity deterministic | PASS | P1-L0.4-VER-REG-001 | PASS |
| P1-L0.4-TST-002 | Lifecycle transitions deterministic | PASS | Version lifecycle and P1-L0.4-VLED-* | PASS |
| P1-L0.4-TST-003 | Only one ACTIVE version exists | PASS | P1-L0.4-ACT-VAL-002 | PASS |
| P1-L0.4-TST-004 | Ratification required before activation | PASS | P1-L0.4-ACT-VAL-001 | PASS |
| P1-L0.4-TST-005 | Compatibility evaluation deterministic | PASS | P1-L0.4-COMP-REG-001 | PASS |
| P1-L0.4-TST-006 | Unknown compatibility fails closed | PASS | P1-L0.4-COMP-002 | PASS |
| P1-L0.4-TST-007 | Version lineage immutable | PASS | P1-L0.4-LIN-GRAPH-001 | PASS |
| P1-L0.4-TST-008 | Version history never rewritten | PASS | P1-L0.4-VER-LEDGER-001 | PASS |
| P1-L0.4-TST-009 | Replay references preserved | PASS | P1-L0.4-RPL-* | PASS |
| P1-L0.4-TST-010 | Evidence complete | PASS | P1-L0.4-EV-* | PASS |
| P1-L0.4-TST-011 | Audit history complete | PASS | P1-L0.4-VER-LEDGER-001 | PASS |
| P1-L0.4-TST-012 | Programs inherit ACTIVE version correctly | PASS | P1-L0.4-ACT-VAL-004 | PASS |
| P1-L0.4-TST-013 | Supersession deterministic | PASS | Version lifecycle, lineage graph | PASS |
| P1-L0.4-TST-014 | Archival deterministic | PASS | Version lifecycle, ledger rules | PASS |
| P1-L0.4-TST-015 | Governance authority enforced | PASS | P1-L0-AUTH-001, P1-L0.1-GOV-CONTRACT-001 | PASS |

## Certification Decision

| Certification ID | Scope | Version | Outcome | Authority | Restrictions | Effective state |
| --- | --- | --- | --- | --- | --- | --- |
| P1-L0.4-CERT-DEC-001 | L0.4 Constitutional Version Governance | 1.0.0 | PASS | P1-L0-AUTH-002 | None | CERTIFIED |

Certification rationale:

L0.4 establishes deterministic constitutional version governance without replacing amendment workflow, framework ownership, program versioning, or implementation release management. It defines the version registry, compatibility registry, lineage graph, version ledger, replay service, evidence registry, fork prevention, active-version control, and certification evidence required for safe constitutional version evolution.

## Constitutional Rules

- Every constitutional version has a globally unique immutable identity.
- Version history is never rewritten.
- Every lifecycle transition generates immutable evidence.
- Only `RATIFIED` versions may become `ACTIVE`.
- Only one constitutional version may be `ACTIVE` simultaneously.
- `SUPERSEDED` versions remain replayable indefinitely.
- `ARCHIVED` versions remain permanently accessible for audit.
- Compatibility decisions are deterministic.
- Constitutional versions never fork into multiple active constitutional authorities.
- Programs inherit the currently `ACTIVE` constitutional version without modification.
- Constitutional replay reproduces the exact constitutional version that governed the original decision.
- Every compatibility determination references immutable evidence.
- Unknown compatibility status fails closed.

## Final Exit Criteria

L0.4 is complete when:

- Version governance is operational.
- Version lifecycle is deterministic.
- Version identity is immutable.
- Compatibility is deterministic.
- Compatibility registry is operational.
- Lineage is complete.
- Lineage is immutable.
- Replay is reproducible.
- Evidence is complete.
- Audit is complete.
- Constitutional inheritance is verified.
- Supersession is deterministic.
- Archival is operational.
- Governance is enforced.
- Certification passed.
