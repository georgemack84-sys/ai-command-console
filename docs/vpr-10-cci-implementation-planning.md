# VPR.10 - CCI Implementation Planning

Status: implementation planning baseline

Predecessors:

- [VPR.1 - Platform Capability Discovery](./vpr-1-platform-capability-discovery.md)
- [VPR.2 - Shared Service Qualification](./vpr-2-shared-service-qualification.md)
- [VPR.3 - Service Decomposition](./vpr-3-service-decomposition.md)
- [VPR.4 - Infrastructure Boundary Definition](./vpr-4-infrastructure-boundary-definition.md)
- [VPR.5 - Platform Dependency Architecture](./vpr-5-platform-dependency-architecture.md)
- [VPR.6 - Platform Contract Library](./vpr-6-platform-contract-library.md)
- [VPR.7 - Vocabulary and Semantic Governance](./vpr-7-vocabulary-semantic-governance.md)
- [VPR.8 - Reference Platform Architecture](./vpr-8-reference-platform-architecture.md)
- [VPR.9 - Platform Readiness Assessment](./vpr-9-platform-readiness-assessment.md)

## Purpose

VPR.10 transforms validated platform requirements into a governed, implementation-ready execution plan for Civitas Core Infrastructure (CCI) while preserving constitutional integrity, implementation traceability, operational continuity, tenant isolation, and migration safety.

This phase converts the validated platform architecture and readiness decisions from VPR.8 and VPR.9 into an executable roadmap for building CCI and migrating proven capabilities from Mission Control.

## Planning Scope

The CCI Implementation Planning baseline governs:

- Implementation phases and priorities.
- Work breakdown structure and accountable ownership.
- Dependency sequencing and release boundaries.
- Capability extraction from Mission Control.
- Migration readiness, rollback, and certification gates.
- Platform adoption by Mission Control, Capability Atlas, CAF Legion, Ecosystem Platforms, CATA Trust Framework, Civitas Proving Ground, and future programs.
- Evidence capture for planning, extraction, implementation, migration, rollback, certification, and adoption.

Planning invariants:

- Only constitutionally qualified capabilities may be migrated into CCI.
- Every extracted capability preserves immutable lineage to its originating implementation.
- Migration does not compromise constitutional governance, tenant isolation, trust, or security.
- Every migration activity has an approved rollback strategy before execution.
- All implementation decisions produce immutable, replayable evidence.
- Adoption occurs only after constitutional, operational, implementation, and certification readiness thresholds are met.

## CCI Implementation Roadmap

Roadmap phases:

| Phase ID | Phase | Objective | Entry criteria | Exit criteria | Primary outputs |
| --- | --- | --- | --- | --- | --- |
| CCI-IMP-P0 | Planning and Mobilization | Establish implementation governance, backlog, release train, and evidence controls. | VPR.9 readiness baseline approved. | Implementation governance active and backlog sequenced. | WBS, evidence ledger, release plan, risk register. |
| CCI-IMP-P1 | Constitutional Control Plane | Implement governance, identity, registry, audit, evidence, replay, lineage, dependency, contract, and semantic validation foundations. | P0 complete; foundational candidates approved. | Control-plane certification suite passes. | CCI core control-plane services. |
| CCI-IMP-P2 | Trust, Security, and Tenant Isolation | Implement trust qualification, tenant boundary, authorization, secrets, security controls, and certification kernel. | P1 contracts and evidence services operational. | Trust, tenant, and security validation passes. | Trust service, tenant isolation, security controls. |
| CCI-IMP-P3 | Platform Runtime Infrastructure | Implement API, event, workflow, scheduling, query, configuration, resource, observability, and resilience infrastructure. | P1 and P2 enforcement services available. | Runtime infrastructure passes contract, replay, and operational validation. | Shared runtime services and operational plane. |
| CCI-IMP-P4 | Capability Extraction and Coexistence | Extract approved Mission Control capabilities into CCI with lineage, compatibility, and rollback. | Candidate extraction plans certified. | Extracted services operate in controlled coexistence mode. | Extracted CCI capabilities and replacement adapters. |
| CCI-IMP-P5 | Program Adoption Waves | Onboard programs through governed adoption phases and compatibility windows. | Coexistence mode validated. | Programs consume CCI contracts without direct implementation bypass. | Adoption records, program migration evidence. |
| CCI-IMP-P6 | Production Certification and Promotion | Certify CCI release, close restrictions, retire replaced Mission Control implementations. | Adoption evidence complete and rollback validated. | CCI production promotion authorized. | Certification decision, retirement evidence, production baseline. |

Roadmap sequencing rules:

- P1 must establish identity, registry, audit, evidence, replay, dependency, contract, and semantic validation before dependent platform runtime services are activated.
- P2 must establish trust, security, and tenant isolation before program adoption or external integration.
- P3 services may be implemented before P2 exit but cannot enter production activation until P2 enforcement gates pass.
- P4 extraction cannot begin for a capability until its readiness assessment is `READY` or `CONDITIONALLY_READY` with approved restrictions.
- P5 adoption requires contract compatibility, tenant scope validation, rollback checkpoints, and certification transition evidence.
- P6 cannot promote any release with unresolved constitutional, trust, security, tenant, or certification blockers.

## Implementation Work Breakdown Structure

| WBS ID | Work package | Phase | Owner | Architecture refs | Readiness refs | Deliverables | Exit gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CCI-WBS-001 | Establish implementation governance and evidence controls | P0 | Constitutional Governance Steward | VPR8-ADR-001, VPR8-EV-014 | VPR9-EV-* | Implementation governance charter, evidence ledger, decision template | Governance approval |
| CCI-WBS-002 | Build identity and workload identity service | P1 | CCI Identity Steward | CCI-CMP-002, CCI-SEC-001 | VPR9-RA-001, CCI-PCAND-001 | Identity APIs, namespace registry, workload identity binding | Contract and security validation |
| CCI-WBS-003 | Build registry, dependency, contract, and semantic validation services | P1 | CCI Registry Steward, Dependency Steward, Validation Steward | CCI-CMP-003, CCI-CMP-015, CCI-CMP-016 | VPR9-RA-002, VPR9-RA-018, VPR9-RA-019, VPR9-RA-020 | Registry, dependency graph, validation engine, semantic checks | Conformance validation |
| CCI-WBS-004 | Build governance and policy decision kernel | P1 | Constitutional Governance Steward | CCI-CMP-001, CCI-CMP-004 | VPR9-RA-003 | Governance API, policy enforcement, authority decisions | Constitutional certification |
| CCI-WBS-005 | Build audit, evidence, replay, and lineage services | P1 | Audit Ledger Steward, Replay Steward | CCI-CMP-005, CCI-CMP-006 | VPR9-RA-004, VPR9-RA-005, VPR9-RA-006 | Audit ledger, evidence registry, replay engine, lineage API | Replay validation |
| CCI-WBS-006 | Build trust and tenant boundary services | P2 | Trust Boundary Steward | CCI-CMP-007, CCI-CMP-017 | VPR9-RA-009 | Trust qualification, revocation, tenant scope enforcement | Trust and tenant certification |
| CCI-WBS-007 | Build certification kernel and conformance automation | P2 | Certification Steward | CCI-CMP-008 | VPR9-RA-010 | Certification runner, result issuance, conformance ledger | Certification suite pass |
| CCI-WBS-008 | Build security, configuration, and secrets plane | P2 | Security Steward, Configuration Steward | CCI-CMP-011, CCI-SEC-* | VPR9-RA-011, VPR9-RA-012 | Config service, secrets manager, key and rotation controls | Security certification |
| CCI-WBS-009 | Build API infrastructure and contract router | P3 | API Platform Steward | CCI-CMP-009 | VPR9-RA-016 | API gateway, contract routing, rate policy, request validation | API conformance pass |
| CCI-WBS-010 | Build event and messaging backbone | P3 | Event Steward | CCI-CMP-010 | VPR9-RA-007 | Event bus, subscriptions, event replay, message integrity | Event replay validation |
| CCI-WBS-011 | Build workflow, scheduling, query, resource, and observability services | P3 | Workflow Steward, Scheduling Steward, Query Steward, Resource Steward, Observability Steward | CCI-CMP-012, CCI-CMP-013, CCI-CMP-014, CCI-CMP-020 | VPR9-RA-008, VPR9-RA-013, VPR9-RA-014, VPR9-RA-015, VPR9-RA-017 | Runtime services and observability plane | Runtime certification |
| CCI-WBS-012 | Define extraction adapters and compatibility windows | P4 | CCI Migration Steward | CCI-BND-007, CCI-XPI-* | VPR9-PR-* | Extraction adapters, coexistence contracts, compatibility matrix | Migration readiness approval |
| CCI-WBS-013 | Execute capability extraction waves | P4 | Capability owners and CCI Migration Steward | CCI-PCAND-* | VPR9-IRR-* | Extracted capabilities, migration evidence, rollback checkpoints | Extraction certification |
| CCI-WBS-014 | Run program adoption waves | P5 | Program Adoption Steward | CCI-XPI-* | CCI-PCAND-* | Program onboarding records, adoption evidence, compatibility reports | Adoption certification |
| CCI-WBS-015 | Retire replaced Mission Control implementations | P6 | Mission Control Steward | VPR10-MIG-*, VPR10-ROLL-* | VPR9-PR-* | Retirement records, lineage preservation, fallback closure | Retirement approval |
| CCI-WBS-016 | Certify and promote CCI release | P6 | Certification Steward | VPR8-CERT-*, VPR10-EV-* | VPR9-CERT refs | Release certification, production promotion decision | Production authorization |

## Platform Implementation Dependency Graph

Dependency classes:

- Constitutional dependency
- Platform service dependency
- Runtime dependency
- Data dependency
- Trust dependency
- Security dependency
- Certification dependency
- Migration dependency
- Adoption dependency
- Retirement dependency

| Dependency ID | Provider work package | Consumer work package | Dependency class | Sequencing rule | Validation |
| --- | --- | --- | --- | --- | --- |
| VPR10-IDEP-001 | CCI-WBS-001 | All work packages | Constitutional dependency | Governance and evidence controls precede implementation decisions. | PASS |
| VPR10-IDEP-002 | CCI-WBS-002 | CCI-WBS-003 through CCI-WBS-016 | Security dependency | Identity service precedes governed service interactions. | PASS |
| VPR10-IDEP-003 | CCI-WBS-003 | CCI-WBS-004 through CCI-WBS-016 | Platform service dependency | Registry, dependency, contract, and semantic validation precede conformance. | PASS |
| VPR10-IDEP-004 | CCI-WBS-004 | CCI-WBS-006 through CCI-WBS-016 | Constitutional dependency | Governance and policy enforcement precede trust, runtime, migration, and adoption. | PASS |
| VPR10-IDEP-005 | CCI-WBS-005 | CCI-WBS-007 through CCI-WBS-016 | Certification dependency | Certification requires evidence, replay, audit, and lineage. | PASS |
| VPR10-IDEP-006 | CCI-WBS-006 | CCI-WBS-009 through CCI-WBS-016 | Trust dependency | Trust and tenant isolation precede API, runtime, extraction, and adoption. | PASS |
| VPR10-IDEP-007 | CCI-WBS-007 | CCI-WBS-013 through CCI-WBS-016 | Certification dependency | Extraction, adoption, and release promotion require certification automation. | PASS |
| VPR10-IDEP-008 | CCI-WBS-008 | CCI-WBS-009 through CCI-WBS-014 | Security dependency | Security, configuration, and secrets precede runtime activation and adoption. | PASS |
| VPR10-IDEP-009 | CCI-WBS-009 | CCI-WBS-010 through CCI-WBS-014 | Runtime dependency | API routing precedes event, workflow, extraction, and adoption calls. | PASS |
| VPR10-IDEP-010 | CCI-WBS-010, CCI-WBS-011 | CCI-WBS-013, CCI-WBS-014 | Runtime dependency | Runtime infrastructure precedes extraction and program adoption. | PASS |
| VPR10-IDEP-011 | CCI-WBS-012 | CCI-WBS-013 | Migration dependency | Extraction adapters and compatibility windows precede extraction execution. | PASS |
| VPR10-IDEP-012 | CCI-WBS-013 | CCI-WBS-014 | Adoption dependency | Extracted capabilities must be validated before adoption waves. | PASS |
| VPR10-IDEP-013 | CCI-WBS-014 | CCI-WBS-015 | Retirement dependency | Program adoption must be complete before retiring replaced implementations. | PASS |
| VPR10-IDEP-014 | CCI-WBS-015 | CCI-WBS-016 | Certification dependency | Retirement evidence contributes to final production certification. | PASS |

Dependency graph rules:

- No implementation phase begins until all hard predecessors are approved or explicitly qualified.
- Parallel work is permitted only where dependency graph validation shows no authority, trust, security, tenant, or certification conflict.
- Any dependency change triggers readiness revalidation and migration risk reassessment.
- Circular implementation dependencies are prohibited.

## CCI Release Plan

| Release ID | Release | Included phases | Included candidates | Release boundary | Certification gate | Promotion state |
| --- | --- | --- | --- | --- | --- | --- |
| CCI-REL-0 | Planning Baseline | P0 | None | Governance, backlog, evidence controls | Planning approval | APPROVED_FOR_PLANNING |
| CCI-REL-1 | Core Control Plane Alpha | P1 | CCI-PCAND-001 through CCI-PCAND-005, CCI-PCAND-009 through CCI-PCAND-011 | Identity, registry, governance, audit, evidence, replay, dependency, contract, semantic validation | Control-plane conformance | APPROVED_FOR_BUILD |
| CCI-REL-2 | Trust and Security Beta | P2 | CCI-PCAND-006, CCI-PCAND-007, CCI-PCAND-015, CCI-PCAND-016 | Trust, tenant, certification, security, configuration, secrets | Trust/security/tenant certification | CONDITIONAL_BUILD |
| CCI-REL-3 | Runtime Infrastructure Beta | P3 | CCI-PCAND-008, CCI-PCAND-013, CCI-PCAND-014, CCI-PCAND-017 through CCI-PCAND-020 | API, event, workflow, scheduling, query, resource, observability | Runtime certification | CONDITIONAL_BUILD |
| CCI-REL-4 | Extraction and Coexistence RC | P4 | All extraction-approved candidates | Mission Control coexistence and compatibility windows | Migration readiness and rollback validation | CONDITIONAL_RELEASE |
| CCI-REL-5 | Program Adoption RC | P5 | Program adoption cohorts | Program onboarding and contract adoption | Adoption certification | CONDITIONAL_RELEASE |
| CCI-REL-6 | Production CCI Baseline | P6 | Production-certified CCI capabilities | Production promotion and Mission Control retirement | Final certification decision | PENDING_CERTIFICATION |

Release rules:

- A release boundary contains only components whose dependencies are satisfied within the same or previous release.
- Conditional releases cannot become production baselines until all certification blockers are closed.
- Release artifacts include contracts, version registry entries, deployment topology, rollback checkpoints, and evidence hashes.
- Release promotion requires replayable certification evidence.

## Implementation Readiness Matrix

Readiness dimensions:

- Constitutional readiness
- Implementation readiness
- Operational readiness
- Migration readiness
- Certification readiness
- Dependency readiness
- Security readiness
- Organizational readiness

Readiness scale:

- `BLOCKED`
- `AT_RISK`
- `READY_WITH_RESTRICTIONS`
- `READY`
- `CERTIFIED`

| Phase | Constitutional | Implementation | Operational | Migration | Certification | Dependency | Security | Organizational | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | CERTIFIED | READY | READY | READY_WITH_RESTRICTIONS | READY | CERTIFIED | READY | READY | START |
| P1 | CERTIFIED | READY | READY_WITH_RESTRICTIONS | AT_RISK | READY_WITH_RESTRICTIONS | CERTIFIED | READY | READY | START |
| P2 | CERTIFIED | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | AT_RISK | READY_WITH_RESTRICTIONS | READY | READY_WITH_RESTRICTIONS | READY | START_WITH_RESTRICTIONS |
| P3 | CERTIFIED | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | AT_RISK | READY_WITH_RESTRICTIONS | READY | READY_WITH_RESTRICTIONS | READY | START_WITH_RESTRICTIONS |
| P4 | READY | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | READY | READY_WITH_RESTRICTIONS | AT_RISK | HOLD_FOR_EXTRACTION_GATE |
| P5 | READY | READY | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | READY_WITH_RESTRICTIONS | READY | READY | AT_RISK | HOLD_FOR_ADOPTION_GATE |
| P6 | READY | READY | READY | READY | READY_WITH_RESTRICTIONS | READY | READY | READY | HOLD_FOR_FINAL_CERTIFICATION |

Readiness threshold rules:

- No phase starts with constitutional readiness below `READY`.
- No migration or adoption phase starts with security readiness below `READY_WITH_RESTRICTIONS`.
- No production promotion occurs with certification readiness below `CERTIFIED`.
- `AT_RISK` dimensions require mitigation plans and owner assignment before phase start.

## Capability Extraction Plan

Extraction states:

- `IDENTIFIED`
- `QUALIFIED`
- `PLANNED`
- `ADAPTER_READY`
- `EXTRACTING`
- `COEXISTING`
- `CCI_PRIMARY`
- `SOURCE_RETIRED`
- `ARCHIVED`

| Extraction ID | Capability | Source implementation | Target CCI component | Readiness refs | Extraction order | Replacement strategy | Retirement strategy | Certification prerequisites |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR10-EXT-001 | Identity Service | Mission Control identity implementation | CCI-CMP-002 | VPR9-RA-001 | 1 | Dual-read identity resolution, then CCI primary writes | Retain source read-only until lineage verification | CCI-CON-001, CCI-SEC-001 |
| VPR10-EXT-002 | Registry Service | Mission Control registry implementation | CCI-CMP-003 | VPR9-RA-002 | 2 | Mirror registration with CCI canonical registry | Retire source writes after supersession validation | CCI-CON-002 |
| VPR10-EXT-003 | Governance and Policy Service | Mission Control governance logic | CCI-CMP-001, CCI-CMP-004 | VPR9-RA-003 | 3 | Shadow decisions, compare, then CCI terminal authority | Retire source decision authority after certification | CCI-CON-003 |
| VPR10-EXT-004 | Audit, Evidence, Replay, and Lineage | Mission Control logs and replay tooling | CCI-CMP-005, CCI-CMP-006 | VPR9-RA-004, VPR9-RA-005, VPR9-RA-006 | 4 | Evidence mirror, hash verification, replay comparison | Archive source logs after immutable import | CCI-CON-004, CCI-CON-005, CCI-CON-006, CCI-CON-020, CCI-CON-021 |
| VPR10-EXT-005 | Dependency and Contract Validation | Mission Control validation routines | CCI-CMP-015, CCI-CMP-016 | VPR9-RA-018, VPR9-RA-019, VPR9-RA-020 | 5 | CCI validation runs in advisory mode, then enforcement mode | Retire source validation after conformance parity | CCI-CON-018, CCI-CON-019 |
| VPR10-EXT-006 | Trust and Tenant Boundary Service | Mission Control boundary checks | CCI-CMP-007, CCI-CMP-017 | VPR9-RA-009 | 6 | Shadow tenant decisions, fail-closed parity, CCI enforcement | Retire source boundary checks after isolation proof | CCI-CON-009 |
| VPR10-EXT-007 | API Infrastructure | Mission Control API routing | CCI-CMP-009 | VPR9-RA-016 | 7 | Compatibility window with route-by-contract migration | Retire source routes after all consumers switch | CCI-CON-016 |
| VPR10-EXT-008 | Event and Messaging | Mission Control event bus | CCI-CMP-010 | VPR9-RA-007 | 8 | Dual-publish with origin preservation and replay comparison | Retire source topics after subscriber migration | CCI-CON-007 |
| VPR10-EXT-009 | Workflow, Scheduler, Query, Resource, Observability | Mission Control runtime services | CCI-CMP-012, CCI-CMP-013, CCI-CMP-014, CCI-CMP-020 | VPR9-RA-008, VPR9-RA-013, VPR9-RA-014, VPR9-RA-015, VPR9-RA-017 | 9 | Service-by-service coexistence and contract-bound migration | Retire source services after operational parity | CCI-CON-008, CCI-CON-013, CCI-CON-014, CCI-CON-015, CCI-CON-017 |
| VPR10-EXT-010 | Configuration and Secrets | Mission Control config and credential handling | CCI-CMP-011 | VPR9-RA-011, VPR9-RA-012 | 10 | Secret reference migration and config supersession | Retire embedded config and raw secret paths | CCI-CON-011, CCI-CON-012, CCI-SEC-004 |

Extraction rules:

- Every extracted capability maintains immutable lineage to the originating Mission Control implementation.
- Extraction cannot begin without approved readiness assessment, migration risk assessment, rollback plan, and certification prerequisites.
- Source implementation may remain during coexistence but shall not retain canonical ownership after CCI promotion.
- Replacement strategy must preserve compatibility and tenant isolation throughout transition.
- Retirement strategy must preserve historical evidence, replay records, and supersession lineage.

## Migration Risk Assessment

Risk dimensions:

- Architectural risk
- Dependency risk
- Constitutional risk
- Governance risk
- Implementation complexity
- Operational disruption
- Compatibility risk
- Certification risk
- Replay risk
- Security risk
- Adoption risk

Risk scale:

- `LOW`
- `MODERATE`
- `HIGH`
- `CRITICAL`

Migration readiness score:

```text
migration_readiness_score =
  100
  - architectural_risk_penalty
  - dependency_risk_penalty
  - constitutional_risk_penalty
  - governance_risk_penalty
  - implementation_complexity_penalty
  - operational_disruption_penalty
  - compatibility_risk_penalty
  - certification_risk_penalty
  - replay_risk_penalty
  - security_risk_penalty
  - adoption_risk_penalty
```

Minimum migration readiness:

- `90-100`: migration approved.
- `75-89`: migration approved with restrictions.
- `60-74`: migration held for remediation.
- `<60`: migration rejected until replanned.

| Risk ID | Migration scope | Overall risk | Constitutional risk | Security risk | Compatibility risk | Replay risk | Readiness score | Decision | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR10-RISK-001 | Identity extraction | MODERATE | LOW | MODERATE | MODERATE | LOW | 86 | APPROVED_WITH_RESTRICTIONS | Dual-read validation, namespace freeze, rollback checkpoint before CCI-primary writes. |
| VPR10-RISK-002 | Registry extraction | MODERATE | LOW | LOW | MODERATE | LOW | 88 | APPROVED_WITH_RESTRICTIONS | Mirror registration and supersession diff checks. |
| VPR10-RISK-003 | Governance and policy extraction | HIGH | MODERATE | MODERATE | HIGH | MODERATE | 78 | APPROVED_WITH_RESTRICTIONS | Shadow decisions, diff threshold, constitutional approval before terminal authority switch. |
| VPR10-RISK-004 | Audit, evidence, replay, lineage extraction | HIGH | LOW | MODERATE | MODERATE | HIGH | 76 | APPROVED_WITH_RESTRICTIONS | Hash verification, replay comparison, immutable import, source archive validation. |
| VPR10-RISK-005 | Trust and tenant boundary extraction | HIGH | MODERATE | HIGH | MODERATE | MODERATE | 75 | APPROVED_WITH_RESTRICTIONS | Fail-closed parity testing, tenant isolation validation, revocation rehearsal. |
| VPR10-RISK-006 | API infrastructure migration | HIGH | LOW | HIGH | HIGH | MODERATE | 72 | HOLD_FOR_REMEDIATION | Complete route compatibility, rate policy, trust check, and rollback validation. |
| VPR10-RISK-007 | Event and messaging migration | HIGH | LOW | MODERATE | HIGH | HIGH | 70 | HOLD_FOR_REMEDIATION | Complete dual-publish validation, replay proof, subscriber compatibility, message integrity certification. |
| VPR10-RISK-008 | Runtime service migration | HIGH | LOW | MODERATE | HIGH | MODERATE | 74 | HOLD_FOR_REMEDIATION | Service-by-service cutover plans and operational parity thresholds. |
| VPR10-RISK-009 | Configuration and secrets migration | CRITICAL | MODERATE | CRITICAL | HIGH | MODERATE | 62 | HOLD_FOR_REMEDIATION | Secret reference migration, rotation proof, evidence redaction, backend adapter certification. |

Risk rules:

- No migration proceeds with unacceptable constitutional risk.
- `CRITICAL` security risk blocks migration until mitigated.
- Replay risk above `MODERATE` requires replay proof before cutover.
- Compatibility risk above `MODERATE` requires a compatibility window and consumer-by-consumer adoption plan.
- Risk assessments are rerun before every extraction, adoption, and retirement milestone.

## Rollback Migration Plan

Rollback record fields:

```text
rollback_id
migration_scope
rollback_boundary
rollback_checkpoint_refs
rollback_triggers
rollback_owner
dependency_rollback_order
replay_restoration_refs
certification_restoration_refs
operational_recovery_steps
rollback_validation_refs
evidence_refs
integrity_hash
```

Rollback triggers:

- Constitutional governance mismatch.
- Ownership ambiguity.
- Contract compatibility failure.
- Tenant isolation failure.
- Trust qualification failure.
- Security control failure.
- Replay validation failure.
- Certification regression.
- Operational error budget breach.
- Consumer adoption failure.
- Evidence integrity failure.

| Rollback ID | Migration scope | Boundary | Checkpoints | Trigger examples | Owner | Dependency rollback order | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VPR10-ROLL-001 | Identity extraction | Before CCI-primary writes | Identity mirror snapshot, namespace freeze, source authority marker | Identity mismatch, namespace collision, workload binding failure | CCI Identity Steward | Restore source read/write, invalidate CCI write tokens, replay identity diffs | Identity replay and audit verification |
| VPR10-ROLL-002 | Registry extraction | Before source write retirement | Registry mirror snapshot, supersession diff, source write lock marker | Missing canonical record, supersession conflict | CCI Registry Steward | Restore source writes, pause CCI registry promotion, reconcile diffs | Registry lineage validation |
| VPR10-ROLL-003 | Governance extraction | Before CCI terminal authority switch | Shadow decision baseline, policy version lock, approval marker | Decision divergence, authority mismatch, policy conflict | Constitutional Governance Steward | Re-enable source terminal decisions, retain CCI advisory mode, replay divergences | Governance replay validation |
| VPR10-ROLL-004 | Evidence and replay extraction | Before source archive | Hash manifest, replay baseline, imported evidence snapshot | Hash mismatch, replay failure, missing evidence | Audit Ledger Steward, Replay Steward | Restore source evidence access, quarantine imported records, rerun replay import | Evidence hash-chain verification |
| VPR10-ROLL-005 | Trust and tenant extraction | Before enforcement switch | Tenant isolation proof, trust revocation rehearsal, source fallback marker | Tenant leakage, trust mismatch, revocation failure | Trust Boundary Steward | Re-enable source boundary checks, quarantine CCI decisions, replay trust records | Tenant isolation and revocation validation |
| VPR10-ROLL-006 | API migration | Per route group | Route compatibility snapshot, consumer list, rate policy baseline | Route failure, authorization mismatch, latency breach | API Platform Steward | Restore source routes, invalidate CCI route mappings, notify consumers | Contract and route validation |
| VPR10-ROLL-007 | Event migration | Per topic or stream | Dual-publish checkpoint, subscriber ack baseline, replay cursor | Message loss, origin mismatch, replay cursor drift | Event Steward | Restore source-primary topic, pause CCI subscriptions, replay missing events | Stream replay and subscriber validation |
| VPR10-ROLL-008 | Runtime service migration | Per service | Service state checkpoint, workflow/schedule snapshot, query index baseline | Workflow divergence, schedule misfire, query inconsistency | Runtime Service Stewards | Restore source service primary, pause CCI writes, replay state deltas | Service-specific replay validation |
| VPR10-ROLL-009 | Configuration and secrets migration | Per tenant and service | Config version checkpoint, secret reference map, rotation baseline | Secret exposure, invalid reference, config rollback failure | Security Steward, Configuration Steward | Restore source config path, rotate affected secrets, quarantine evidence | Security and config validation |

Rollback rules:

- Rollback plans are approved before migration execution.
- Rollback restores governance, certification, operational integrity, and tenant isolation.
- Rollback does not erase evidence; rollback activities append evidence.
- Rollback order follows the implementation dependency graph in reverse where dependencies are active.
- Rollback completion requires replay validation and certification restoration.

## Platform Adoption Strategy

Adoption phases:

- `AWARENESS`
- `CONTRACT_ALIGNMENT`
- `SANDBOX_INTEGRATION`
- `DUAL_RUN`
- `CCI_PRIMARY`
- `SOURCE_RETIREMENT`
- `STEADY_STATE`

Adoption support scope:

- Mission Control
- Capability Atlas
- CAF Legion
- Ecosystem Platforms
- CATA Trust Framework
- Civitas Proving Ground
- Future Civitas programs

| Adoption ID | Program | Adoption sequence | Primary CCI capabilities | Coexistence strategy | Compatibility window | Certification transition |
| --- | --- | --- | --- | --- | --- | --- |
| VPR10-ADOPT-001 | Mission Control | 1 | Identity, registry, governance, audit, evidence, replay, API, runtime services | Source and CCI dual-run with CCI becoming canonical owner | Release 4 through Release 6 | Migration certification and source retirement evidence |
| VPR10-ADOPT-002 | Capability Atlas | 2 | Registry, dependency, semantic validation, evidence, API | Atlas publishes to CCI registry while retaining local read cache | Release 4 through Release 5 | Contract compatibility and registry lineage validation |
| VPR10-ADOPT-003 | CAF Legion | 3 | Identity, trust, governance, evidence, eventing, advisory adapter | Advisory outputs routed through CCI event and evidence contracts | Release 5 through Release 6 | Advisory/execution separation certification |
| VPR10-ADOPT-004 | Ecosystem Platforms | 4 | API, trust, tenant boundary, workflow, query, certification | Tenant-aware contract adoption by platform cohort | Release 5 through Release 6 | Tenant isolation and contract certification |
| VPR10-ADOPT-005 | CATA Trust Framework | 5 | Trust qualification, attestation, security evidence, certification | Trust requirements imported into CCI trust model | Release 5 | Trust validation and revocation replay |
| VPR10-ADOPT-006 | Civitas Proving Ground | 6 | Certification, replay, evidence, failure injection, resilience | Proving evidence becomes certification input | Release 4 through Release 6 | Replay and synthetic evidence certification |
| VPR10-ADOPT-007 | Future Civitas Programs | 7 | Contract-bound platform services | Program onboarding through CCI adoption playbook | Post Release 6 | Program certification before production |

Adoption rules:

- Programs adopt CCI capabilities only through registered contracts.
- Adoption preserves tenant isolation, compatibility, lineage, and security context.
- Coexistence windows are explicitly versioned and time-bound.
- Version transitions preserve backward compatibility or require approved migration exceptions.
- Adoption decisions produce immutable evidence and are replayable.
- Organizational readiness is measured before program cutover.

## Implementation Evidence Ledger

Evidence record fields:

```text
evidence_id
evidence_type
source_phase
source_work_package
bound_capability_refs
bound_component_refs
bound_contract_refs
decision_refs
risk_refs
rollback_refs
certification_refs
lineage_refs
integrity_hash
```

| Evidence ID | Evidence | Phase | Bound refs | Integrity requirement |
| --- | --- | --- | --- | --- |
| VPR10-EV-001 | Implementation roadmap approval | P0 | CCI-IMP-P* | Governance decision hash |
| VPR10-EV-002 | Work breakdown structure approval | P0 | CCI-WBS-* | Owner and exit-gate hash |
| VPR10-EV-003 | Implementation dependency graph validation | P0 | VPR10-IDEP-* | Cycle-free graph hash |
| VPR10-EV-004 | Release plan approval | P0 | CCI-REL-* | Release boundary and gate hash |
| VPR10-EV-005 | Implementation readiness matrix snapshot | P0-P6 | Readiness matrix | Phase decision hash |
| VPR10-EV-006 | Capability extraction plan approval | P4 | VPR10-EXT-* | Capability lineage hash |
| VPR10-EV-007 | Migration risk assessment approval | P4-P6 | VPR10-RISK-* | Risk score and mitigation hash |
| VPR10-EV-008 | Rollback migration plan approval | P4-P6 | VPR10-ROLL-* | Checkpoint and trigger hash |
| VPR10-EV-009 | Platform adoption strategy approval | P5 | VPR10-ADOPT-* | Program adoption decision hash |
| VPR10-EV-010 | Extraction execution evidence | P4 | VPR10-EXT-* | Source-to-CCI lineage hash |
| VPR10-EV-011 | Migration execution evidence | P4-P5 | VPR10-RISK-*, VPR10-ROLL-* | Migration event and rollback checkpoint hash |
| VPR10-EV-012 | Rollback execution evidence | P4-P6 | VPR10-ROLL-* | Rollback replay and restoration hash |
| VPR10-EV-013 | Certification execution evidence | P1-P6 | CCI-REL-* | Certification result hash |
| VPR10-EV-014 | Adoption execution evidence | P5 | VPR10-ADOPT-* | Consumer transition hash |
| VPR10-EV-015 | Retirement evidence | P6 | CCI-WBS-015 | Source retirement and archive hash |
| VPR10-EV-016 | Final implementation authorization | P6 | CCI-WBS-016, CCI-REL-6 | Production promotion decision hash |

## Implementation Decision Registry

| Decision ID | Decision | Scope | Rationale | Evidence refs | Outcome |
| --- | --- | --- | --- | --- | --- |
| VPR10-DEC-001 | Implement constitutional control plane before runtime infrastructure | P1-P3 | CCI runtime services require identity, governance, audit, evidence, replay, dependency, contract, and semantic validation. | VPR10-IDEP-002 through VPR10-IDEP-006 | APPROVED |
| VPR10-DEC-002 | Use coexistence mode for Mission Control extraction | P4 | Coexistence minimizes migration risk and preserves rollback safety. | VPR10-EXT-*, VPR10-ROLL-* | APPROVED |
| VPR10-DEC-003 | Require rollback plans before extraction execution | P4-P6 | Migration cannot proceed without deterministic recovery. | VPR10-ROLL-* | APPROVED |
| VPR10-DEC-004 | Hold API, event, runtime, configuration, and secrets migration for remediation gates | P3-P4 | VPR.9 conditionally ready services require operational and certification evidence closure. | VPR9-REM-*, VPR10-RISK-* | APPROVED |
| VPR10-DEC-005 | Adopt programs through contract-bound waves | P5 | Program adoption must preserve compatibility, tenant isolation, and evidence lineage. | VPR10-ADOPT-* | APPROVED |
| VPR10-DEC-006 | Treat production CCI baseline as pending final certification | P6 | Production promotion requires release certification and retirement evidence. | CCI-REL-6, VPR10-EV-016 | APPROVED |

## Implementation Lineage Ledger

| Lineage ID | From | To | Relationship | Replay requirement |
| --- | --- | --- | --- | --- |
| VPR10-LIN-001 | VPR.1 capability evidence | VPR10-EXT-* | Extraction source | Capability discovery replay |
| VPR10-LIN-002 | VPR.2 shared service qualification | CCI-WBS-* | Implementation eligibility | Qualification replay |
| VPR10-LIN-003 | VPR.3 service decomposition | CCI-WBS-* | Component responsibility source | Decomposition replay |
| VPR10-LIN-004 | VPR.4 ownership and boundary registry | VPR10-RISK-*, VPR10-ROLL-* | Migration governance input | Ownership and boundary replay |
| VPR10-LIN-005 | VPR.5 dependency architecture | VPR10-IDEP-* | Sequencing input | Dependency graph replay |
| VPR10-LIN-006 | VPR.6 contract library | CCI-REL-*, VPR10-ADOPT-* | Release and adoption interface source | Contract version replay |
| VPR10-LIN-007 | VPR.7 semantic governance | CCI-WBS-003 | Semantic validation input | Ontology validation replay |
| VPR10-LIN-008 | VPR.8 reference architecture | CCI-WBS-*, CCI-REL-* | Architecture implementation source | Architecture conformance replay |
| VPR10-LIN-009 | VPR.9 readiness assessment | VPR10-RISK-*, VPR10-EXT-* | Promotion and migration input | Readiness decision replay |
| VPR10-LIN-010 | VPR10 implementation evidence | CCI production baseline | Final implementation lineage | Implementation replay |

## Constitutional Rules

- Only constitutionally qualified capabilities may be migrated into CCI.
- Every extracted capability preserves immutable lineage to its originating implementation.
- Migration never compromises constitutional governance.
- Migration plans are deterministic and replayable.
- Every migration activity defines an approved rollback strategy before execution.
- Rollback restores governance, certification, operational integrity, trust, security, and tenant isolation.
- Platform adoption preserves compatibility and tenant isolation throughout transition.
- Capability ownership remains unique throughout extraction and migration.
- No implementation bypasses constitutional qualification or certification.
- All implementation decisions produce immutable evidence.
- Migration risk is evaluated before every implementation milestone.
- Adoption occurs only after constitutional, operational, implementation, dependency, security, and certification readiness are achieved.

## Final Exit Criteria

VPR.10 is complete when:

- Implementation roadmap is approved.
- Implementation sequencing is deterministic.
- Work breakdown structure is owned and exit-gated.
- Platform implementation dependency graph is validated.
- CCI release plan is defined.
- Implementation readiness matrix is complete.
- Capability extraction plan is complete.
- Migration risk assessment is approved.
- Rollback migration plan is validated.
- Platform adoption strategy is approved.
- Implementation evidence ledger is established.
- Implementation replay is reproducible.
- Constitutional governance is maintained.
- CCI implementation is authorized.
