# Program 1 - Layer 0 Constitutional Intake Framework

Status: constitutional intake framework baseline

Program: Program 1 - Capability Atlas

Layer: Layer 0 - Constitutional Foundation

Phase: L0.7 - Constitutional Intake Framework

Predecessors:

- [Program 1 - Layer 0 Constitutional Contract](./program-1-layer-0-constitutional-contract.md)
- [Program 1 - Layer 0 Constitutional Governance](./program-1-layer-0-constitutional-governance.md)
- [Program 1 - Layer 0 Constitutional Amendment Framework](./program-1-layer-0-constitutional-amendment-framework.md)
- [Program 1 - Layer 0 Constitutional Framework Governance](./program-1-layer-0-constitutional-framework-governance.md)
- [Program 1 - Layer 0 Constitutional Version Governance](./program-1-layer-0-constitutional-version-governance.md)
- [Program 1 - Layer 0 Conflict Governance](./program-1-layer-0-conflict-governance.md)
- [Program 1 - Layer 0 Constitutional Certification Framework](./program-1-layer-0-constitutional-certification-framework.md)
- [VPR.12 - Certification Gate](./vpr-12-certification-gate.md)

## Purpose

L0.7 establishes the constitutional intake framework governing how capabilities enter the Civitas ecosystem for qualification.

This phase provides deterministic routing, qualification path selection, evidence production, and lineage assignment so every capability follows the correct constitutional path before entering any downstream program.

L0.7 introduces no alternative governance model. It inherits Layer 0 authority, governance, amendment, framework, version, conflict, and certification controls.

## Objectives

L0.7 establishes:

- Constitutional capability qualification.
- Deterministic intake routing.
- Differentiation between reusable platform capabilities and net-new capabilities.
- Immutable constitutional lineage.
- Qualification ambiguity prevention.
- Immutable intake evidence.
- Deterministic replay.
- Qualification ledgering.
- Intake conflict detection.
- Certification of intake classification, routing, evidence, lineage, replay, and ledger integrity.

## Constitutional Scope

L0.7 governs only constitutional intake.

It governs:

- Intake submission.
- Intake classification.
- Capability origin evaluation.
- Qualification path selection.
- Intake routing evidence.
- Intake lineage assignment.
- Intake replay.
- Qualification ledgering.
- Intake routing conflicts.

It does not:

- Qualify implementation quality.
- Certify production readiness.
- Govern operational lifecycle.
- Replace program-specific qualification.
- Replace VPR or CQR domain-specific qualification work.

Those responsibilities remain within downstream constitutional frameworks.

## Constitutional Intake Contract

Contract ID: `P1-L0.7-INTAKE-CONTRACT-001`

Inherited authority: `P1-L0-CONTRACT-001`

Governance authority: `P1-L0.1-GOV-CONTRACT-001`

Conflict governance: `P1-L0.5-CONFLICT-CLASS-REG-001`

Certification authority: `P1-L0.6-CERT-CONTRACT-001`

The Constitutional Intake Contract defines:

- Constitutional intake lifecycle.
- Intake authority.
- Qualification ownership.
- Routing semantics.
- Intake evidence requirements.
- Replay obligations.
- Conflict integration.
- Qualification ledger requirements.

Contract rules:

- Capabilities with Mission Control operational lineage route to VPR.
- Capabilities with existing operational platform lineage route to VPR.
- Existing reusable capabilities route to VPR.
- Capabilities without operational lineage route to CQR.
- Research proposals and prototypes without lineage route to CQR.
- Routing is deterministic.
- Routing ambiguity fails closed.
- Manual routing overrides are prohibited.
- Qualification completes before downstream program admission.

## Intake States

```text
SUBMITTED
  -> CLASSIFIED
  -> ROUTED
  -> QUALIFICATION_IN_PROGRESS
  -> QUALIFIED
```

Alternative terminal path:

```text
SUBMITTED
  -> CLASSIFIED
  -> ROUTED
  -> QUALIFICATION_IN_PROGRESS
  -> REJECTED
```

State rules:

- Terminal states are immutable.
- State changes are additive ledger events.
- Replay reconstructs every state transition.
- A rejected capability may be resubmitted only as a new intake record with lineage to the rejected record.

## Intake Decision Model

Every intake produces:

```text
intake_id
capability_id
origin_classification
selected_qualification_path
routing_evidence_refs
constitutional_authority_ref
qualification_status
replay_ref
timestamp
evidence_hash
integrity_hash
```

Timestamp rule:

- Timestamp is evidentiary metadata only.
- Timestamp shall not determine routing, authority, lineage, qualification path, or replay ordering.

## Qualification Paths

### Path A - Validated Platform Requirements

Path ID: `P1-L0.7-PATH-VPR`

Used when a capability originates from an existing operational system.

Purpose:

- Qualify reusable platform capabilities for constitutional reuse.

Flow:

```text
Operational Capability
  -> Platform Extraction
  -> Platform Validation
  -> Dependency Validation
  -> Platform Qualification
  -> Qualification Ledger
```

VPR responsibilities:

- Reusable capability identification.
- Platform extraction validation.
- Platform boundary validation.
- Shared service qualification.
- Dependency evaluation.
- Constitutional readiness.

VPR outputs:

- Platform Qualification Record.
- Platform Lineage Record.
- Platform Evidence Package.

### Path B - Capability Qualification Review

Path ID: `P1-L0.7-PATH-CQR`

Used when a capability has no operational lineage.

Purpose:

- Qualify constitutionally new capabilities.

Flow:

```text
New Capability Proposal
  -> Constitutional Review
  -> Governance Review
  -> Dependency Validation
  -> Capability Qualification
  -> Qualification Ledger
```

CQR responsibilities:

- Capability review.
- Constitutional evaluation.
- Governance assessment.
- Dependency validation.
- Qualification recommendation.
- Evidence generation.

CQR outputs:

- Capability Qualification Record.
- Qualification Evidence Package.
- Qualification Decision Record.

## Constitutional Routing Matrix

| Capability origin | Qualification path | Required evidence | Failure behavior |
| --- | --- | --- | --- |
| Mission Control lineage | VPR | Operational lineage evidence | Fail closed if routed to CQR |
| Existing operational platform | VPR | Platform operation evidence | Fail closed if routed to CQR |
| Existing reusable capability | VPR | Reuse and lineage evidence | Fail closed if routed to CQR |
| Net-new capability | CQR | Proposal and no-lineage evidence | Fail closed if routed to VPR |
| Research proposal | CQR | Proposal evidence | Fail closed if routed to VPR |
| Prototype without lineage | CQR | Prototype and no-lineage evidence | Fail closed if routed to VPR |
| Ambiguous or conflicting lineage | None until conflict resolved | Conflict evidence | INTAKE_ROUTING_VIOLATION |

## Intake Routing Engine

Engine ID: `P1-L0.7-ROUTE-ENG-001`

The Intake Routing Engine provides deterministic constitutional routing.

Routing engine responsibilities:

- Lineage evaluation.
- Routing determination.
- Intake validation.
- Framework selection.
- Conflict detection.
- Routing evidence generation.

Routing engine outputs:

- Intake Routing Decision.
- Routing Evidence.
- Routing Replay Record.

Routing decision fields:

```text
routing_decision_id
intake_id
capability_id
origin_classification
lineage_evaluation_result
selected_framework
selected_qualification_path
conflict_refs
evidence_refs
replay_refs
decision_result
integrity_hash
```

Routing rules:

- Routing decisions are deterministic.
- Routing preserves constitutional lineage.
- Routing produces immutable evidence.
- Routing ambiguity fails closed.
- Manual routing overrides are prohibited.
- Routing cannot be corrected by mutation; corrections create superseding routing records.

## Origin Classification Registry

Registry ID: `P1-L0.7-ORIGIN-REG-001`

| Origin ID | Origin classification | Description | Qualification path | Required evidence |
| --- | --- | --- | --- | --- |
| P1-L0.7-ORIGIN-001 | MISSION_CONTROL_LINEAGE | Capability originates from Mission Control operational implementation. | VPR | Mission Control lineage record |
| P1-L0.7-ORIGIN-002 | EXISTING_OPERATIONAL_PLATFORM | Capability originates from an existing operational platform outside Mission Control. | VPR | Operational platform evidence |
| P1-L0.7-ORIGIN-003 | EXISTING_REUSABLE_CAPABILITY | Capability already exists and is reusable across programs. | VPR | Reuse and ownership evidence |
| P1-L0.7-ORIGIN-004 | NET_NEW_CAPABILITY | Capability has no operational lineage. | CQR | New capability proposal |
| P1-L0.7-ORIGIN-005 | RESEARCH_PROPOSAL | Capability is exploratory and not operational. | CQR | Research proposal evidence |
| P1-L0.7-ORIGIN-006 | PROTOTYPE_WITHOUT_LINEAGE | Prototype exists but lacks operational lineage. | CQR | Prototype and no-lineage evidence |
| P1-L0.7-ORIGIN-007 | AMBIGUOUS_LINEAGE | Origin classification cannot be resolved deterministically. | None | Conflict record required |
| P1-L0.7-ORIGIN-008 | CONFLICTING_LINEAGE | Evidence supports multiple incompatible origin classifications. | None | Conflict record required |

## Qualification Ledger

Ledger ID: `P1-L0.7-QUAL-LEDGER-001`

The Qualification Ledger maintains immutable constitutional qualification history.

Ledger characteristics:

- Immutable.
- Additive.
- Versioned.
- Replayable.
- Auditable.

Ledger record fields:

```text
qualification_ledger_id
intake_id
capability_id
origin_classification
routing_decision_ref
qualification_path
qualification_status
evidence_refs
constitutional_decision_refs
lineage_refs
conflict_refs
replay_refs
integrity_hash
```

| Ledger ID | Intake event | Path | Evidence | Replay | State |
| --- | --- | --- | --- | --- | --- |
| P1-L0.7-QLED-001 | Intake framework activation | Framework | P1-L0.7-EV-001 | P1-L0.7-RPL-001 | QUALIFIED |
| P1-L0.7-QLED-002 | VPR path registration | VPR | P1-L0.7-EV-002 | P1-L0.7-RPL-002 | QUALIFIED |
| P1-L0.7-QLED-003 | CQR path registration | CQR | P1-L0.7-EV-003 | P1-L0.7-RPL-003 | QUALIFIED |
| P1-L0.7-QLED-004 | Routing engine certification | Routing | P1-L0.7-EV-004 | P1-L0.7-RPL-004 | QUALIFIED |
| P1-L0.7-QLED-005 | Conflict integration certification | Conflict integration | P1-L0.7-EV-005 | P1-L0.7-RPL-005 | QUALIFIED |

Ledger rules:

- Qualification history is never modified.
- Every intake request is ledgered.
- Every routing decision is ledgered.
- Every qualification path decision is ledgered.
- Superseding qualification records preserve prior decisions.

## Constitutional Conflict Integration

Conflict class: `INTAKE_ROUTING_VIOLATION`

Conflict class ref: `P1-L0.5-CC-002`

Occurs when:

- VPR capability is routed to CQR.
- CQR capability is routed to VPR.
- Routing cannot be determined.
- Conflicting lineage exists.
- Routing evidence is incomplete.
- Manual routing is attempted.

Conflict integration rules:

- Routing conflicts are governed by L0.5.
- Routing conflicts never auto-resolve.
- Routing conflict remediation requires constitutional governance authorization.
- Routing cannot proceed until conflict is resolved or a new governed intake record is created.

## Evidence Requirements

Every qualification generates:

- Intake Evidence.
- Routing Evidence.
- Lineage Evidence.
- Qualification Evidence.
- Governance Evidence.
- Dependency Evidence.
- Authority Evidence.
- Replay Evidence.

Evidence record fields:

```text
evidence_id
intake_id
capability_id
evidence_type
producing_authority
producing_stage
qualification_path_ref
lineage_refs
governance_refs
dependency_refs
replay_refs
integrity_hash
```

| Evidence ID | Evidence | Bound refs | Qualification use | Replay |
| --- | --- | --- | --- | --- |
| P1-L0.7-EV-001 | Intake contract evidence | P1-L0.7-INTAKE-CONTRACT-001 | Intake framework certification | P1-L0.7-RPL-001 |
| P1-L0.7-EV-002 | VPR path evidence | P1-L0.7-PATH-VPR | Platform-origin qualification | P1-L0.7-RPL-002 |
| P1-L0.7-EV-003 | CQR path evidence | P1-L0.7-PATH-CQR | Net-new qualification | P1-L0.7-RPL-003 |
| P1-L0.7-EV-004 | Routing engine evidence | P1-L0.7-ROUTE-ENG-001 | Deterministic routing certification | P1-L0.7-RPL-004 |
| P1-L0.7-EV-005 | Intake routing conflict evidence | P1-L0.5-CC-002 | Conflict detection certification | P1-L0.7-RPL-005 |

Evidence rules:

- Evidence is immutable.
- Evidence is additive.
- Evidence is lineage-bound.
- Evidence is replayable.
- Missing intake evidence blocks qualification.

## Replay Requirements

Replay Service ID: `P1-L0.7-RPL-SVC-001`

Replay deterministically reproduces:

- Intake classification.
- Routing decision.
- Qualification path.
- Governance evaluation.
- Lineage determination.
- Evidence production.
- Final qualification decision.

Replay profile fields:

```text
replay_id
intake_refs
classification_refs
routing_decision_refs
qualification_path_refs
governance_refs
lineage_refs
evidence_refs
expected_outcome
replay_result
integrity_hash
```

| Replay ID | Replay scope | Required inputs | Expected outcome | Status |
| --- | --- | --- | --- | --- |
| P1-L0.7-RPL-001 | Intake contract replay | P1-L0.7-INTAKE-CONTRACT-001 | Intake framework reconstructed | READY |
| P1-L0.7-RPL-002 | VPR path replay | P1-L0.7-PATH-VPR | Operational lineage routes to VPR | READY |
| P1-L0.7-RPL-003 | CQR path replay | P1-L0.7-PATH-CQR | No-lineage capability routes to CQR | READY |
| P1-L0.7-RPL-004 | Routing engine replay | P1-L0.7-ROUTE-ENG-001 | Identical inputs produce identical route | READY |
| P1-L0.7-RPL-005 | Intake conflict replay | P1-L0.5-CC-002 | Misrouting produces INTAKE_ROUTING_VIOLATION | READY |

Replay divergence constitutes a constitutional violation and opens a governed conflict record.

## Framework Inheritance

Inheritance Contract ID: `P1-L0.7-INH-001`

Downstream programs inherit:

- Intake routing semantics.
- Origin classification rules.
- VPR and CQR path selection.
- Evidence requirements.
- Replay requirements.
- Qualification ledger obligations.
- Intake routing conflict handling.
- Prohibition on manual routing overrides.

Programs shall not:

- Redefine VPR routing.
- Redefine CQR routing.
- Introduce manual routing overrides.
- Skip qualification before downstream admission.
- Mutate qualification history.
- Resolve routing ambiguity outside L0.5 conflict governance.

## Certification Requirements

L0.7 certifies:

- Intake classification determinism.
- VPR routing for Mission Control lineage.
- CQR routing for net-new capability.
- Routing engine determinism.
- Qualification path reproducibility.
- Lineage preservation.
- Intake evidence completeness.
- Qualification ledger immutability.
- Replay determinism.
- `INTAKE_ROUTING_VIOLATION` detection.

## Certification Test Matrix

| Test ID | Test | Expected | Evidence | Failure condition | Result |
| --- | --- | --- | --- | --- | --- |
| P1-L0.7-TST-001 | Intake classification deterministic | PASS | Classification evidence | Classification differs under replay | PASS |
| P1-L0.7-TST-002 | Mission Control lineage routes to VPR | PASS | Routing decision and lineage evidence | Incorrect routing | PASS |
| P1-L0.7-TST-003 | Net-new capability routes to CQR | PASS | Routing decision and qualification evidence | Incorrect routing | PASS |
| P1-L0.7-TST-004 | Routing engine deterministic | PASS | Replay evidence | Different routing for identical inputs | PASS |
| P1-L0.7-TST-005 | Qualification path reproducible | PASS | Qualification ledger | Replay mismatch | PASS |
| P1-L0.7-TST-006 | Lineage preserved | PASS | Lineage evidence | Missing or altered lineage | PASS |
| P1-L0.7-TST-007 | Intake evidence complete | PASS | Evidence package | Missing required evidence | PASS |
| P1-L0.7-TST-008 | Qualification ledger immutable | PASS | Ledger verification | Historical mutation detected | PASS |
| P1-L0.7-TST-009 | Replay deterministic | PASS | Replay validation | Divergent replay results | PASS |
| P1-L0.7-TST-010 | INTAKE_ROUTING_VIOLATION detected | PASS | Conflict record | Misrouting not detected | PASS |
| P1-L0.7-TST-011 | Manual routing override prohibited | PASS | Routing policy evidence | Manual override accepted | PASS |
| P1-L0.7-TST-012 | Downstream admission requires qualification | PASS | Qualification ledger | Admission before qualification | PASS |

## Certification Decision

| Certification ID | Scope | Version | Outcome | Authority | Restrictions | Effective state |
| --- | --- | --- | --- | --- | --- | --- |
| P1-L0.7-CERT-DEC-001 | L0.7 Constitutional Intake Framework | 1.0.0 | PASS | P1-L0-AUTH-002 | None | CERTIFIED |

Certification rationale:

L0.7 establishes deterministic constitutional intake routing and qualification path selection. Capabilities with operational lineage route to VPR; net-new capabilities route to CQR; ambiguity fails closed; manual routing is prohibited; qualification evidence, lineage, ledgering, conflict integration, replay, and certification are mandatory.

## Constitutional Rules

- Capabilities with Mission Control operational lineage always route to VPR.
- Capabilities without operational lineage always route to CQR.
- Routing decisions are deterministic.
- Routing produces immutable evidence.
- Routing preserves constitutional lineage.
- Qualification history is never modified.
- Every intake decision is replayable.
- Routing ambiguity fails closed.
- Manual routing overrides are prohibited.
- Qualification completes before downstream program admission.
- Routing conflicts are governed by L0.5.
- Replay divergence constitutes a constitutional violation.

## Final Exit Criteria

L0.7 is complete when:

- Constitutional intake is operational.
- Intake classification is deterministic.
- Routing is validated.
- VPR qualification is operational.
- CQR qualification is operational.
- Qualification paths are deterministic.
- Qualification evidence is complete.
- Qualification lineage is preserved.
- Qualification ledger is immutable.
- Replay is reproducible.
- `INTAKE_ROUTING_VIOLATION` detection is validated.
- Constitutional intake is certified.
