# Program 1 - Capability Registration Foundation

Status: registration foundation baseline

Program: Program 1 - Capability Atlas

Phase: P1.1 - Capability Registration Foundation

Predecessors:

- [Program 1 - Capability Atlas Bootstrap Instantiation](./program-1-capability-atlas-bootstrap-instantiation.md)
- [Program 1 - Layer 0 Constitutional Certification Gate](./program-1-layer-0-constitutional-certification-gate.md)
- [Program 1 - Layer 0 Identity and Policy Governance](./program-1-layer-0-identity-policy-governance.md)
- [Program 1 - Layer 0 Constitutional Certification Framework](./program-1-layer-0-constitutional-certification-framework.md)
- [Program 1 - Layer 0 Constitutional Intake Framework](./program-1-layer-0-constitutional-intake-framework.md)

## Purpose

P1.1 establishes the constitutional foundation for registering capabilities within the Capability Atlas.

Capability registration is the authoritative entry point into the Atlas lifecycle. It determines whether a capability has constitutional existence, how it is uniquely identified, who owns it, which namespace governs it, which evidence supports it, and how its registration decision can be replayed.

This phase creates the registration contract, registry, validators, decision engine, evidence ledger, and replay service required for all future dependency mapping, classification, qualification, certification, reuse, and lifecycle governance.

## Scope

P1.1 establishes:

- Capability Registration Contract.
- Immutable Capability Identity model.
- Capability Registration Service.
- Capability Registry.
- Capability Identity Validator.
- Capability Namespace Validator.
- Capability Ownership Validator.
- Registration Policy Registry.
- Registration Decision Engine.
- Registration Evidence Ledger.
- Registration Replay Service.

P1.1 does not establish:

- Capability dependency classification.
- Capability qualification outcomes.
- Capability certification outcomes.
- Runtime implementation approval.
- Platform service decomposition.
- Program-specific capability override authority.

## Constitutional Position

```text
Layer 0 Constitutional Foundation
  -> P1.0 Atlas Bootstrap
  -> P1.1 Capability Registration Foundation
  -> Capability Dependency Mapping
  -> Capability Classification
  -> Capability Qualification
  -> Capability Certification
  -> Capability Lifecycle Management
```

P1.1 inherits all Layer 0 controls for authority, identity, policy separation, intake, evidence, replay, certification, conflict precedence, amendment, and version governance.

P1.1 is the first Atlas phase that creates constitutional capability existence.

## Registration Principle

A capability does not constitutionally exist until it has passed registration and received an immutable Capability Registration Record.

Registration creates identity. It does not certify readiness, approve implementation, or authorize production use.

## Capability Registration Contract

Contract ID: `P1.1-REG-CONTRACT-001`

The Capability Registration Contract defines the canonical agreement for registering capabilities in the Atlas.

Contract fields:

- Contract ID.
- Contract name.
- Constitutional owner.
- Governing authority.
- Registration scope.
- Supported registration types.
- Required identity fields.
- Required metadata fields.
- Validation obligations.
- Decision obligations.
- Evidence obligations.
- Replay obligations.
- Lineage obligations.
- Certification prerequisites.
- Consumer obligations.
- Provider obligations.
- Extension constraints.

Contract requirements:

- Registration shall be deterministic.
- Registration shall be evidence-producing.
- Registration shall be replayable.
- Registration shall preserve immutable identity.
- Registration shall validate namespace authority.
- Registration shall validate owner authority.
- Registration shall preserve complete lineage.
- Registration shall never rewrite registration history.

Contract owner: Layer 0 Constitutional Governance Authority.

Operational steward: Capability Atlas Authority.

## Supported Registration Types

Registration type registry ID: `P1.1-REG-TYPE-REG-001`

| Registration type | Type ID | Purpose | Required authority |
| --- | --- | --- | --- |
| Bootstrap Registration | `P1.1-RT-BOOTSTRAP` | Register Atlas bootstrap capabilities inherited from P1.0. | Atlas Bootstrap Authority |
| New Capability Registration | `P1.1-RT-NEW` | Register a newly proposed capability. | Capability owner |
| Imported Capability Registration | `P1.1-RT-IMPORTED` | Register a capability imported from an external source. | Import governance authority |
| Platform Capability Registration | `P1.1-RT-PLATFORM` | Register a validated platform capability. | Platform owner |
| Shared Capability Registration | `P1.1-RT-SHARED` | Register a capability intended for cross-program reuse. | Shared capability owner |
| Framework Capability Registration | `P1.1-RT-FRAMEWORK` | Register a capability inherited from a framework. | Framework owner |
| Application Capability Registration | `P1.1-RT-APPLICATION` | Register an application-scoped capability. | Application owner |
| Migration Registration | `P1.1-RT-MIGRATION` | Register a capability migrated from a legacy inventory. | Migration authority |
| Supersession Registration | `P1.1-RT-SUPERSESSION` | Register a successor to an existing capability. | Existing owner or approved successor owner |
| Merge Registration | `P1.1-RT-MERGE` | Register a capability produced by merging prior capabilities. | Merge governance authority |

All registration types use the same identity, evidence, decision, and replay rules.

## Capability Identity

Identity model ID: `P1.1-CAP-ID-MODEL-001`

Capability Identity is immutable after successful registration.

Identity fields:

- Capability ID.
- Canonical name.
- Namespace.
- Constitutional owner.
- Registration timestamp.
- Registration authority.
- Identity hash.
- Lineage reference.

Identity invariants:

- A Capability ID shall identify exactly one capability.
- A capability shall have exactly one canonical constitutional owner.
- A capability shall belong to exactly one canonical namespace at registration time.
- Identity fields shall not be amended after registration.
- Identity corrections require rejection and resubmission before registration, or supersession after registration.
- Identity hash shall be calculated from canonical identity fields.
- Lineage reference shall bind the registration to its full ancestry and replay evidence.

## Capability ID Format

Capability ID standard ID: `P1.1-CAP-ID-STD-001`

Canonical format:

```text
CAP-{namespace_code}-{capability_slug}-{sequence}
```

Example:

```text
CAP-ATLAS-REGISTRATION-0001
```

ID requirements:

- `CAP` prefix is mandatory.
- Namespace code shall map to a registered namespace.
- Capability slug shall be stable, human-readable, and unique within namespace.
- Sequence shall be monotonically allocated within namespace.
- Capability ID shall be immutable after registration.
- Deprecated IDs shall never be reused.

## Canonical Name Rules

Canonical name standard ID: `P1.1-CANON-NAME-STD-001`

Canonical names shall:

- Be unique within namespace.
- Use stable domain language.
- Avoid implementation-specific product names unless the capability itself is product-bound.
- Avoid lifecycle or maturity labels.
- Avoid names that imply certification, qualification, or production status.
- Remain bound to the immutable identity after registration.

Canonical name changes after registration are prohibited. Renaming requires supersession.

## Namespace Binding

Namespace binding standard ID: `P1.1-NS-BIND-STD-001`

Every registered capability shall bind to a namespace governed by its constitutional owner.

Namespace validation checks:

- Namespace exists.
- Namespace is active.
- Namespace owner is recognized.
- Registering authority is authorized for the namespace.
- Requested Capability ID uses the namespace code.
- Namespace allocation has not been revoked.
- Namespace policies are satisfied.

Registration shall fail closed when namespace authority cannot be proven.

## Ownership Binding

Ownership binding standard ID: `P1.1-OWN-BIND-STD-001`

Every registered capability shall have exactly one constitutional owner.

Ownership validation checks:

- Owner exists in the Layer 0 identity registry.
- Owner is authorized to register capabilities.
- Owner has authority over the requested namespace.
- Owner accepts stewardship obligations.
- Owner accepts evidence and replay obligations.
- Owner is accountable for future qualification and certification pathways.

Shared stewardship may be recorded as governance metadata, but it shall not create multiple constitutional owners.

## Registration Metadata

Metadata schema ID: `P1.1-REG-META-SCHEMA-001`

Registration metadata fields:

- Capability type.
- Capability category.
- Maturity level.
- Lifecycle state.
- Registration source.
- Implementation references.
- Dependency references.
- Contract references.
- Ontology references.
- Qualification status.
- Certification status.

Metadata rules:

- Metadata may evolve through governed versioning.
- Metadata changes shall not mutate identity.
- Metadata changes shall create lineage records.
- Metadata changes shall be evidence-producing.
- Metadata changes shall be replayable.
- Metadata shall be complete before registration can be approved.

## Registration States

State model ID: `P1.1-REG-STATE-MODEL-001`

```text
DRAFT
  -> SUBMITTED
  -> VALIDATING
  -> REGISTERED
  -> QUALIFIED
  -> CERTIFIED
  -> SUPERSEDED
  -> ARCHIVED
```

State definitions:

| State | Meaning | Entry requirement | Exit condition |
| --- | --- | --- | --- |
| `DRAFT` | Registration request is being prepared. | Request initiated. | Submitter submits request. |
| `SUBMITTED` | Request is locked for validation intake. | Required request fields present. | Validation begins. |
| `VALIDATING` | Validators and decision engine evaluate the request. | Intake accepted. | Decision produced. |
| `REGISTERED` | Capability has constitutional existence. | REGISTER decision approved. | Qualification, supersession, or archival process starts. |
| `QUALIFIED` | Capability has passed later qualification review. | Qualification evidence accepted. | Certification or supersession process starts. |
| `CERTIFIED` | Capability has passed later certification. | Certification evidence accepted. | Supersession or archival process starts. |
| `SUPERSEDED` | Capability identity remains historical but is replaced for future use. | Supersession registration approved. | Archive when retention conditions are met. |
| `ARCHIVED` | Capability is retained as historical evidence only. | Archival criteria satisfied. | Terminal state. |

State transitions shall be deterministic, policy-bound, evidence-producing, and replayable.

## Prohibited State Transitions

Transition guard ID: `P1.1-REG-STATE-GUARD-001`

The following transitions are prohibited:

- `DRAFT` directly to `REGISTERED`.
- `SUBMITTED` directly to `REGISTERED`.
- `VALIDATING` to `QUALIFIED`.
- `REGISTERED` to `DRAFT`.
- `REGISTERED` to `SUBMITTED`.
- `CERTIFIED` to `REGISTERED`.
- `ARCHIVED` to any non-terminal state.

Correction before registration returns the request to `DRAFT` as a new request revision.

Correction after registration requires governed metadata versioning, supersession, or archival.

## Capability Registration Service

Service ID: `P1.1-REG-SVC-001`

The Capability Registration Service executes registration workflows and writes authoritative records.

Service responsibilities:

- Accept registration requests.
- Validate request schema.
- Bind requests to identity, namespace, and owner records.
- Invoke validators.
- Invoke registration policy evaluation.
- Produce registration decisions.
- Create registration records.
- Write evidence records.
- Update registration state.
- Write replay index entries.
- Emit registration events.

Service constraints:

- Shall not register a capability without a REGISTER decision.
- Shall not mutate registered identity.
- Shall not bypass namespace validation.
- Shall not bypass ownership validation.
- Shall not write records without evidence references.
- Shall not delete historical registration records.

## Capability Registry

Registry ID: `P1.1-CAP-REG-001`

The Capability Registry is the authoritative source of constitutional capability identity.

Registry record types:

- Capability Registration Record.
- Capability Identity Record.
- Capability Metadata Version Record.
- Capability State Record.
- Capability Lineage Record.
- Capability Supersession Record.
- Capability Merge Record.
- Capability Archive Record.

Registry requirements:

- Records shall be append-only.
- Registered identities shall be immutable.
- Capability IDs shall never be reused.
- Registry writes shall require decision references.
- Registry writes shall require evidence references.
- Registry reads shall expose latest state and complete lineage.
- Registry snapshots shall be replayable from ledger evidence.

## Capability Registration Record

Record schema ID: `P1.1-REG-REC-SCHEMA-001`

Every successfully registered capability produces a Capability Registration Record.

Identity section:

- `registration_id`
- `capability_id`
- `canonical_name`
- `namespace`
- `owner_id`

Registration section:

- `registration_state`
- `registration_type`
- `registration_authority`
- `registration_timestamp`
- `registration_version`

Validation section:

- `validation_results`
- `schema_validation_refs`
- `dependency_validation_refs`
- `ontology_validation_refs`

Governance section:

- `governance_refs`
- `qualification_refs`
- `certification_refs`
- `decision_refs`

Lineage section:

- `parent_capability_refs`
- `supersession_refs`
- `merge_refs`
- `replay_refs`

Integrity section:

- `evidence_refs`
- `integrity_hash`

## Registration Request

Request schema ID: `P1.1-REG-REQ-SCHEMA-001`

Registration request fields:

- Request ID.
- Submitter ID.
- Requested registration type.
- Proposed capability identity.
- Proposed metadata.
- Namespace claim.
- Owner claim.
- Source reference.
- Dependency references.
- Contract references.
- Ontology references.
- Lineage references.
- Supporting evidence references.
- Submitter attestation.

Request requirements:

- Requests shall be complete before entering `SUBMITTED`.
- Requests shall bind to a known submitter identity.
- Requests shall include evidence sufficient for validation.
- Requests shall declare whether the capability is new, imported, migrated, superseding, or merged.
- Requests shall include lineage references when prior capability history exists.

## Capability Identity Validator

Validator ID: `P1.1-ID-VAL-001`

The Capability Identity Validator verifies identity uniqueness and immutability constraints.

Validation checks:

- Capability ID format.
- Capability ID uniqueness.
- Canonical name uniqueness within namespace.
- Namespace code alignment.
- Identity hash correctness.
- Duplicate identity detection.
- Reserved ID conflicts.
- Deprecated ID reuse.
- Identity lineage binding.

Failure outcomes:

- Duplicate ID produces `REJECT`.
- Ambiguous identity produces `REQUIRE_CORRECTION`.
- Reserved ID conflict produces `REQUIRE_GOVERNANCE_REVIEW`.
- Missing identity evidence produces `REQUIRE_ADDITIONAL_EVIDENCE`.

## Capability Namespace Validator

Validator ID: `P1.1-NS-VAL-001`

The Capability Namespace Validator verifies namespace existence and authority.

Validation checks:

- Namespace exists in the Namespace Allocation Registry.
- Namespace is active.
- Namespace owner is valid.
- Submitter is authorized within namespace.
- Owner is authorized to govern namespace.
- Namespace policies are satisfied.
- Namespace does not conflict with reserved domains.

Failure outcomes:

- Unknown namespace produces `REQUIRE_NAMESPACE_RESOLUTION`.
- Unauthorized namespace use produces `REJECT`.
- Incomplete namespace evidence produces `REQUIRE_ADDITIONAL_EVIDENCE`.

## Capability Ownership Validator

Validator ID: `P1.1-OWN-VAL-001`

The Capability Ownership Validator verifies constitutional owner authority.

Validation checks:

- Owner exists in Layer 0 identity registry.
- Owner has active authority.
- Owner is not suspended, archived, or superseded.
- Owner may register the requested capability type.
- Owner may register within the requested namespace.
- Owner attestation is present.
- Delegated registration authority is valid when used.

Failure outcomes:

- Invalid owner produces `REQUIRE_OWNERSHIP_RESOLUTION`.
- Unauthorized owner produces `REJECT`.
- Missing owner evidence produces `REQUIRE_ADDITIONAL_EVIDENCE`.

## Schema Validator

Validator ID: `P1.1-SCHEMA-VAL-001`

The Schema Validator confirms registration request and metadata conformance.

Validation checks:

- Required fields present.
- Field values use canonical enumerations.
- References use registered identity formats.
- Metadata is complete for registration type.
- Lifecycle state is valid.
- Registration type is supported.
- Integrity hash input set is complete.

## Dependency Reference Validator

Validator ID: `P1.1-DEP-REF-VAL-001`

The Dependency Reference Validator confirms dependency references are structurally valid.

Validation checks:

- Dependency references use known identity formats.
- Referenced capabilities exist when declared as registered dependencies.
- External references are marked as external.
- Missing dependencies are explicitly identified.
- Dependency evidence is present where required.

P1.1 validates dependency references only. It does not classify, score, approve, or certify dependencies.

## Ontology Compatibility Validator

Validator ID: `P1.1-ONTO-VAL-001`

The Ontology Compatibility Validator confirms vocabulary and semantic references conform to approved terms.

Validation checks:

- Capability type uses canonical vocabulary.
- Capability category uses canonical vocabulary.
- Maturity level uses canonical vocabulary.
- Lifecycle state uses canonical vocabulary.
- Contract references use known interface vocabulary.
- Ontology references are resolvable.

Ontology incompatibility produces `REQUIRE_CORRECTION` unless the issue indicates prohibited semantic conflict, in which case governance review is required.

## Lineage Integrity Validator

Validator ID: `P1.1-LIN-VAL-001`

The Lineage Integrity Validator confirms ancestry, supersession, merge, import, and replay references.

Validation checks:

- Parent capability references exist when required.
- Supersession references point to registered capabilities.
- Merge references identify all merged sources.
- Imported capability records include source lineage.
- Migration records include source inventory references.
- Replay references bind to recorded evidence.
- Lineage graph remains acyclic unless explicitly modeled as historical merge.

## Registration Policy Registry

Policy registry ID: `P1.1-REG-POL-REG-001`

The Registration Policy Registry stores canonical registration policies.

Initial policies:

| Policy ID | Policy | Enforcement |
| --- | --- | --- |
| `P1.1-POL-ID-IMMUTABLE` | Identity fields cannot change after registration. | Fail closed |
| `P1.1-POL-ONE-OWNER` | Each capability has one constitutional owner. | Fail closed |
| `P1.1-POL-NS-AUTH` | Namespace authority is required. | Fail closed |
| `P1.1-POL-EVIDENCE-MANDATORY` | Every decision requires evidence. | Fail closed |
| `P1.1-POL-REPLAY-REQUIRED` | Every registration shall be replayable. | Fail closed |
| `P1.1-POL-LINEAGE-COMPLETE` | Lineage references shall be complete. | Fail closed |
| `P1.1-POL-HISTORY-APPEND-ONLY` | Registration history cannot be rewritten. | Fail closed |
| `P1.1-POL-GOVERNANCE-SUPREMACY` | Registration cannot bypass constitutional governance. | Fail closed |

Policies inherit precedence from Layer 0 conflict governance.

## Registration Decision Engine

Decision engine ID: `P1.1-REG-DEC-ENG-001`

The Registration Decision Engine evaluates validator outputs, policy results, governance requirements, and evidence sufficiency.

Decision inputs:

- Registration request.
- Identity validation result.
- Namespace validation result.
- Ownership validation result.
- Schema validation result.
- Dependency reference validation result.
- Ontology compatibility result.
- Lineage integrity result.
- Policy evaluation result.
- Evidence sufficiency result.
- Governance approval references.

Decision outputs:

- Decision ID.
- Decision outcome.
- Decision rationale.
- Required corrections.
- Required governance review.
- Required evidence.
- State transition.
- Evidence references.
- Replay references.
- Decision hash.

## Registration Decision Outcomes

Outcome registry ID: `P1.1-REG-OUTCOME-REG-001`

| Outcome | Meaning | State impact |
| --- | --- | --- |
| `REGISTER` | Capability registration is approved. | `VALIDATING` to `REGISTERED` |
| `REJECT` | Request violates mandatory rules or cannot be corrected in current form. | Request closed with rejection evidence |
| `REQUIRE_CORRECTION` | Request can be corrected by submitter. | Return to `DRAFT` revision |
| `REQUIRE_GOVERNANCE_REVIEW` | Constitutional authority must review. | Hold in governed review |
| `REQUIRE_NAMESPACE_RESOLUTION` | Namespace authority is unresolved. | Hold until namespace resolution |
| `REQUIRE_OWNERSHIP_RESOLUTION` | Owner authority is unresolved. | Hold until ownership resolution |
| `REQUIRE_ADDITIONAL_EVIDENCE` | Evidence is insufficient. | Hold until evidence package is updated |

Decision outcomes shall be deterministic for identical inputs.

## Registration Evidence Ledger

Ledger ID: `P1.1-REG-EVID-LEDGER-001`

The Registration Evidence Ledger stores immutable evidence for every registration decision.

Evidence records:

- Registration request.
- Validation results.
- Ownership verification.
- Namespace verification.
- Schema validation report.
- Dependency validation report.
- Ontology validation report.
- Lineage validation report.
- Policy evaluation report.
- Decision rationale.
- Governance approvals.
- Replay references.
- Integrity hash.

Ledger requirements:

- Evidence shall be append-only.
- Evidence shall be content-addressable.
- Evidence shall bind to decision IDs.
- Evidence shall bind to registration IDs.
- Evidence shall support independent verification.
- Evidence shall support deterministic replay.

## Registration Evidence Repository

Repository ID: `P1.1-REG-EVID-REPO-001`

The Registration Evidence Repository stores canonical artifacts referenced by the evidence ledger.

Repository artifact classes:

- Request artifact.
- Validation report artifact.
- Governance approval artifact.
- Namespace proof artifact.
- Ownership proof artifact.
- Source lineage artifact.
- Integrity manifest artifact.
- Replay manifest artifact.

Repository rules:

- Artifacts shall not be overwritten.
- Artifact revisions shall receive new artifact IDs.
- Repository manifests shall include hash, timestamp, owner, source, and retention policy.

## Namespace Allocation Registry

Registry ID: `P1.1-NS-ALLOC-REG-001`

The Namespace Allocation Registry records namespace authority used during capability registration.

Fields:

- Namespace ID.
- Namespace code.
- Namespace name.
- Namespace owner.
- Namespace authority.
- Allowed registration types.
- Reserved prefixes.
- Active status.
- Revocation status.
- Policy references.
- Evidence references.

The registry inherits namespace definitions from Layer 0 and P1.0, then records Atlas-specific allocation constraints.

## Capability Ownership Registry

Registry ID: `P1.1-CAP-OWN-REG-001`

The Capability Ownership Registry records ownership bindings for registered capabilities.

Fields:

- Capability ID.
- Owner ID.
- Owner authority reference.
- Registration decision reference.
- Delegation reference.
- Stewardship obligations.
- Ownership status.
- Evidence references.
- Lineage references.

Ownership changes after registration require governed transfer or supersession. They shall not mutate original identity records.

## Registration Ledger

Ledger ID: `P1.1-REG-LEDGER-001`

The Registration Ledger records registration state transitions and decisions.

Ledger entries:

- Ledger entry ID.
- Registration ID.
- Capability ID.
- Prior state.
- New state.
- Decision ID.
- Decision outcome.
- Actor ID.
- Authority reference.
- Timestamp.
- Evidence references.
- Replay references.
- Entry hash.

Ledger rules:

- Entries are append-only.
- State shall be derived from ledger entries.
- Ledger entries shall be ordered by deterministic sequence.
- Conflicting entries shall trigger governance review.
- Ledger replay shall reproduce current registry state.

## Registration Replay Service

Replay service ID: `P1.1-REG-RPL-SVC-001`

The Registration Replay Service reconstructs registration outcomes using recorded evidence.

Replay inputs:

- Registration request artifact.
- Validator versions.
- Policy versions.
- Governance approvals.
- Decision engine version.
- Evidence ledger entries.
- Registry snapshots.
- Replay manifest.

Replay outputs:

- Reconstructed validation results.
- Reconstructed decision outcome.
- Reconstructed state transitions.
- Registry state comparison.
- Replay hash.
- Replay result.

Replay result values:

- `REPLAY_MATCH`
- `REPLAY_MISMATCH`
- `REPLAY_INCOMPLETE_EVIDENCE`
- `REPLAY_POLICY_VERSION_MISSING`
- `REPLAY_VALIDATOR_VERSION_MISSING`
- `REPLAY_REQUIRES_GOVERNANCE_REVIEW`

Replay is authoritative for registration audit.

## Registration Replay Index

Index ID: `P1.1-REG-RPL-IDX-001`

The Registration Replay Index maps registration records to replay artifacts.

Index fields:

- Registration ID.
- Capability ID.
- Decision ID.
- Evidence ledger entries.
- Validator version references.
- Policy version references.
- Decision engine version.
- Replay manifest ID.
- Replay result history.
- Last replay timestamp.
- Replay hash.

## Registration Interfaces

Interface catalog ID: `P1.1-REG-IF-CAT-001`

Supported registration sources:

- Atlas Bootstrap.
- Validated Platform Requirements.
- Capability Qualification Review.
- Mission Control extraction.
- CCI implementation.
- Framework inheritance.
- Program-defined capabilities.
- Migration workflows.

Interface requirements:

- All sources shall submit through the Capability Registration Contract.
- All sources shall provide identity and ownership evidence.
- All sources shall provide namespace evidence.
- All sources shall provide lineage evidence when prior history exists.
- All sources shall accept deterministic registration outcomes.

## Registration Events

Event catalog ID: `P1.1-REG-EVT-CAT-001`

Registration events:

- `CapabilityRegistrationDrafted`
- `CapabilityRegistrationSubmitted`
- `CapabilityRegistrationValidationStarted`
- `CapabilityRegistrationValidated`
- `CapabilityRegistered`
- `CapabilityRegistrationRejected`
- `CapabilityRegistrationCorrectionRequired`
- `CapabilityRegistrationGovernanceReviewRequired`
- `CapabilityRegistrationNamespaceResolutionRequired`
- `CapabilityRegistrationOwnershipResolutionRequired`
- `CapabilityRegistrationEvidenceRequired`
- `CapabilityRegistrationSuperseded`
- `CapabilityRegistrationArchived`

Event rules:

- Events shall include registration ID, capability ID when assigned, state, decision reference, evidence reference, and integrity hash.
- Events shall not expose secrets.
- Events shall not mutate registry state independently of ledger entries.

## Registration Commands

Command catalog ID: `P1.1-REG-CMD-CAT-001`

Supported commands:

- `CreateRegistrationDraft`
- `SubmitRegistrationRequest`
- `ValidateRegistrationRequest`
- `ApproveRegistration`
- `RejectRegistration`
- `RequireRegistrationCorrection`
- `RequireGovernanceReview`
- `ResolveNamespaceClaim`
- `ResolveOwnershipClaim`
- `AttachRegistrationEvidence`
- `SupersedeRegistration`
- `ArchiveRegistration`
- `ReplayRegistrationDecision`

Command requirements:

- Commands shall be authorized.
- Commands shall produce evidence.
- Commands shall be idempotent when retried with the same command ID.
- Commands shall bind to policy and validator versions.

## Registration Queries

Query catalog ID: `P1.1-REG-QRY-CAT-001`

Supported queries:

- `GetCapabilityRegistrationRecord`
- `FindCapabilityById`
- `FindCapabilityByCanonicalName`
- `ListCapabilitiesByNamespace`
- `ListCapabilitiesByOwner`
- `GetRegistrationState`
- `GetRegistrationEvidence`
- `GetRegistrationLineage`
- `GetRegistrationReplayStatus`
- `GetRegistrationDecision`

Query requirements:

- Queries shall distinguish latest state from historical records.
- Queries shall expose immutable identity.
- Queries shall expose evidence references.
- Queries shall preserve policy-based access restrictions.

## Registration Security Requirements

Security profile ID: `P1.1-REG-SEC-001`

Security controls:

- Registration commands require authenticated actor identity.
- Registration approval requires authorized governance authority.
- Namespace resolution requires namespace authority.
- Ownership resolution requires identity governance authority.
- Evidence writes require integrity hashing.
- Registry writes require decision references.
- Replay access is read-only and audit-scoped.
- Sensitive implementation references are redacted according to policy.

## Governance Obligations

Governance obligation registry ID: `P1.1-GOV-OBL-REG-001`

Obligations:

- Enforce immutable identity.
- Enforce exclusive ownership.
- Enforce namespace authority.
- Enforce evidence sufficiency.
- Enforce replay reproducibility.
- Enforce registration policy.
- Enforce lineage preservation.
- Escalate conflicts to Layer 0 conflict governance.
- Record governance decisions in the evidence ledger.

## Registration Failure Profile

Failure profile ID: `P1.1-REG-FAIL-001`

Fail-closed conditions:

- Identity uniqueness cannot be proven.
- Namespace authority cannot be proven.
- Owner authority cannot be proven.
- Required evidence is missing.
- Replay references cannot be generated.
- Integrity hash cannot be calculated.
- Policy version is unknown.
- Validator version is unknown.
- Governance conflict is unresolved.

Fail-open registration is prohibited.

## Dependency Model

Dependency model ID: `P1.1-DEP-MODEL-001`

P1.1 depends on:

- P1.0 Atlas bootstrap namespace and schema.
- Layer 0 constitutional foundation.
- Layer 0 identity governance.
- Layer 0 certification framework.
- Layer 0 intake framework.
- Layer 0 replay and evidence rules.

P1.1 produces inputs for:

- Capability Dependency Mapping.
- Capability Classification.
- Capability Version Governance.
- Capability Qualification.
- Capability Certification.
- Atlas Search and Discovery.
- Capability Lifecycle Management.
- Capability Composition.
- Cross-program Capability Reuse.
- Ecosystem Platform Integration.

## Validation Matrix

Validation matrix ID: `P1.1-REG-VAL-MATRIX-001`

| Validation domain | Validator | Required result | Evidence |
| --- | --- | --- | --- |
| Identity uniqueness | `P1.1-ID-VAL-001` | Unique identity confirmed | Identity validation report |
| Namespace authority | `P1.1-NS-VAL-001` | Namespace authority confirmed | Namespace verification |
| Ownership authority | `P1.1-OWN-VAL-001` | Owner authority confirmed | Ownership verification |
| Schema compliance | `P1.1-SCHEMA-VAL-001` | Request and metadata valid | Schema validation report |
| Dependency references | `P1.1-DEP-REF-VAL-001` | References structurally valid | Dependency validation report |
| Ontology compatibility | `P1.1-ONTO-VAL-001` | Terms compatible | Ontology validation report |
| Lineage integrity | `P1.1-LIN-VAL-001` | Lineage complete | Lineage validation report |
| Policy conformance | `P1.1-REG-POL-REG-001` | Policies satisfied | Policy evaluation report |
| Evidence sufficiency | `P1.1-REG-EVID-LEDGER-001` | Evidence complete | Evidence manifest |
| Replay reproducibility | `P1.1-REG-RPL-SVC-001` | Replay reproducible | Replay report |

## Compliance Matrix

Compliance matrix ID: `P1.1-REG-COMP-MATRIX-001`

| Rule | Compliance mechanism | Required evidence | Result |
| --- | --- | --- | --- |
| Every capability has exactly one immutable Capability ID. | Identity Validator | Identity validation report | Required |
| Every capability has one constitutional owner. | Ownership Validator | Ownership verification | Required |
| Namespace ownership is validated before registration. | Namespace Validator | Namespace verification | Required |
| Registration preserves immutable lineage. | Lineage Integrity Validator | Lineage validation report | Required |
| Registration never rewrites history. | Registration Ledger | Append-only ledger proof | Required |
| Registration produces immutable evidence. | Evidence Ledger | Evidence manifest | Required |
| Registration is reproducible by replay. | Replay Service | Replay result | Required |
| Registration decisions are governed. | Decision Engine | Decision rationale and approvals | Required |
| Metadata may evolve without altering identity. | Metadata Version Record | Version lineage evidence | Required |

## Certification Matrix

Certification matrix ID: `P1.1-CERT-MATRIX-001`

| Certification criterion | Evidence source | Baseline status |
| --- | --- | --- |
| Capability Registration Contract defined | `P1.1-REG-CONTRACT-001` | Satisfied |
| Immutable identity model defined | `P1.1-CAP-ID-MODEL-001` | Satisfied |
| Capability Registry established | `P1.1-CAP-REG-001` | Satisfied |
| Validators defined | `P1.1-ID-VAL-001`, `P1.1-NS-VAL-001`, `P1.1-OWN-VAL-001` | Satisfied |
| Registration lifecycle defined | `P1.1-REG-STATE-MODEL-001` | Satisfied |
| Registration decisions defined | `P1.1-REG-OUTCOME-REG-001` | Satisfied |
| Evidence ledger defined | `P1.1-REG-EVID-LEDGER-001` | Satisfied |
| Replay service defined | `P1.1-REG-RPL-SVC-001` | Satisfied |
| Governance obligations defined | `P1.1-GOV-OBL-REG-001` | Satisfied |
| Fail-closed profile defined | `P1.1-REG-FAIL-001` | Satisfied |

## Exit Criteria Mapping

| Exit criterion | Satisfying artifact | Status |
| --- | --- | --- |
| Capability registration operational | `P1.1-REG-SVC-001` | Defined |
| Immutable identity enforced | `P1.1-CAP-ID-MODEL-001` and `P1.1-ID-VAL-001` | Defined |
| Namespace governance validated | `P1.1-NS-VAL-001` | Defined |
| Ownership uniqueness verified | `P1.1-OWN-VAL-001` | Defined |
| Registration lifecycle deterministic | `P1.1-REG-STATE-MODEL-001` | Defined |
| Validation framework complete | `P1.1-REG-VAL-MATRIX-001` | Defined |
| Evidence generation operational | `P1.1-REG-EVID-LEDGER-001` | Defined |
| Lineage preservation verified | `P1.1-LIN-VAL-001` | Defined |
| Replay reproducible | `P1.1-REG-RPL-SVC-001` | Defined |
| Constitutional governance enforced | `P1.1-GOV-OBL-REG-001` | Defined |
| Registration decisions auditable | `P1.1-REG-LEDGER-001` | Defined |
| Capability Registry established as authoritative source | `P1.1-CAP-REG-001` | Defined |

## Implementation Readiness

Implementation readiness ID: `P1.1-READY-001`

P1.1 is implementation-ready when:

- Registration contract is approved.
- Registration service interface is accepted.
- Capability registry schema is accepted.
- Validators are implemented against canonical policies.
- Decision engine produces deterministic outcomes.
- Evidence ledger stores immutable evidence.
- Replay service reproduces registration decisions.
- Namespace and ownership registries are integrated.
- Registration events, commands, and queries are available.
- Certification matrix has no unresolved mandatory criteria.

## Certification Decision

Decision ID: `P1.1-CERT-DEC-001`

Baseline decision: `PASS`

Rationale:

- Capability Registration Contract is defined.
- Immutable identity is enforced.
- Namespace authority validation is defined.
- Ownership authority validation is defined.
- Registration lifecycle is deterministic and replayable.
- Evidence generation is mandatory.
- Registration decisions are auditable.
- Capability Registry is established as the authoritative source of constitutional capability identity.

Restrictions:

- P1.1 certifies registration foundation only.
- P1.1 does not certify capability qualification.
- P1.1 does not certify capability implementation.
- P1.1 does not certify production use.
- P1.1 does not authorize unmanaged identity mutation.

## Downstream Handoff

P1.1 authorizes subsequent phases to consume:

- Registered capability identity.
- Capability Registration Records.
- Registration state.
- Registration metadata.
- Registration evidence.
- Namespace bindings.
- Ownership bindings.
- Registration lineage.
- Replay references.

Downstream consumers shall not redefine registration identity, ownership, namespace, or evidence semantics.

## Summary

P1.1 establishes constitutional capability registration for the Capability Atlas.

It creates the contract, service, registry, validators, decision engine, evidence ledger, replay service, state model, interfaces, and certification baseline required to make capability identity deterministic, auditable, governed, and reusable.

With P1.1 complete, the Capability Atlas has an authoritative registration foundation and can support dependency mapping, classification, qualification, certification, discovery, lifecycle management, composition, and cross-program reuse.
