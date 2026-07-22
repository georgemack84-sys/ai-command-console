# VPR.7 - Vocabulary and Semantic Governance

Status: semantic governance baseline

Predecessors:

- [VPR.1 - Platform Capability Discovery](./vpr-1-platform-capability-discovery.md)
- [VPR.2 - Shared Service Qualification](./vpr-2-shared-service-qualification.md)
- [VPR.3 - Service Decomposition](./vpr-3-service-decomposition.md)
- [VPR.4 - Infrastructure Boundary Definition](./vpr-4-infrastructure-boundary-definition.md)
- [VPR.5 - Platform Dependency Architecture](./vpr-5-platform-dependency-architecture.md)
- [VPR.6 - Platform Contract Library](./vpr-6-platform-contract-library.md)

## Purpose

VPR.7 establishes the canonical vocabulary, ontology, and semantic relationship model governing all Validated Platform Requirements and their transition into Civitas Core Infrastructure (CCI).

This artifact ensures platform specifications do not merely use consistent terminology, but express entities, relationships, ownership, authority, inheritance, dependency, compatibility, and lineage with deterministic and machine-verifiable meaning.

The resulting semantic model is the authoritative language through which Mission Control capabilities are normalized, promoted, implemented, governed, certified, and consumed across the Civitas ecosystem.

## Vocabulary and Semantic Governance Contract

Every canonical platform concept has one authoritative definition and one immutable semantic identity.

Constitutional rules:

- Canonical semantic meaning takes precedence over local terminology.
- No program may redefine a canonical platform concept.
- No relationship may be inferred from naming similarity.
- No specification may use an undefined entity type or relationship type.
- Semantic identity is immutable; terminology may evolve through aliases and supersession.
- Semantic changes are versioned, governed, traceable, replayable, and certifiable.
- Ambiguous or conflicting semantic definitions fail validation and enter semantic conflict governance.
- Later VPR phases and CCI implementation artifacts must reference approved semantic definitions.

Required semantic record fields:

```text
semantic_entity_id
canonical_name
canonical_definition
entity_type
ontology_domain
namespace
semantic_version
source_lineage_refs
owning_authority
governing_authority
lifecycle_state
compatibility_status
certification_status
integrity_hash
```

## Shared Vocabulary Registry

Vocabulary states:

```text
DRAFT
  -> PROPOSED
  -> APPROVED
  -> CANONICAL
  -> DEPRECATED
  -> SUPERSEDED
  -> ARCHIVED
```

| Vocabulary ID | Canonical term | Definition | Entity type | Domain | Accepted aliases | Prohibited aliases | Owner | Version | Status | Lineage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR-VOC-001 | Platform Capability | Reusable infrastructure capability discovered from Mission Control and eligible for qualification. | Platform Capability | qualification | reusable capability, discovered capability | feature, app module | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.1 |
| VPR-VOC-002 | Shared Platform Service | Published platform service with canonical contracts and CCI ownership. | Platform Service | service | shared service, CCI service | local service | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.2, VPR.3 |
| VPR-VOC-003 | Platform Infrastructure | Reusable infrastructure implemented and owned by CCI. | Infrastructure Component | boundary | CCI infrastructure | program infrastructure | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.4 |
| VPR-VOC-004 | Application Capability | Mission-specific functionality retained outside CCI. | Application Capability | boundary | application service, product capability | platform service | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.1-VPR.4 |
| VPR-VOC-005 | Constitutional Owner | Exclusive authority responsible for canonical platform meaning, lifecycle, compatibility, and certification. | Ownership Authority | ownership | platform owner, canonical owner | maintainer, implementer | Constitutional Governance Steward | `1.0.0` | CANONICAL | VPR.4 |
| VPR-VOC-006 | Authority | Explicitly granted and scoped permission to govern, approve, certify, execute, or review. | Governance Authority | authority | granted authority | ownership | Constitutional Governance Steward | `1.0.0` | CANONICAL | VPR.4 |
| VPR-VOC-007 | Dependency | Directional reliance of one entity on another declared with strength, lifecycle, failure policy, lineage, and compatibility. | Dependency | dependency | dependency edge | inheritance, ownership | Dependency Steward | `1.0.0` | CANONICAL | VPR.5 |
| VPR-VOC-008 | Inheritance | Governed semantic transfer of approved definitions, guarantees, policies, schemas, or obligations across layers. | Semantic Relationship | inheritance | inherited constraint | dependency, composition | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.5 |
| VPR-VOC-009 | Contract | Canonical interface agreement governing exposure, consumption, validation, versioning, and certification. | Contract | contract | platform contract | API implementation | Contract Steward | `1.0.0` | CANONICAL | VPR.6 |
| VPR-VOC-010 | Extension Point | Governed mechanism allowing programs to extend platform behavior without modifying platform internals. | Extension Point | extension | provider contract, plugin point | fork, patch | CCI Registry Steward | `1.0.0` | CANONICAL | VPR.3, VPR.4, VPR.6 |
| VPR-VOC-011 | Evidence Record | Immutable record supporting qualification, validation, certification, replay, or governance decisions. | Evidence Record | evidence | evidence ref, proof record | note, claim | Evidence Steward | `1.0.0` | CANONICAL | VPR.1-VPR.6 |
| VPR-VOC-012 | Replay Record | Immutable reconstruction reference proving deterministic behavior or historical semantic state. | Replay Record | replay | replay evidence | log replay only | Replay Steward | `1.0.0` | CANONICAL | VPR.1-VPR.6 |
| VPR-VOC-013 | Semantic Identity | Immutable identity assigned to a canonical concept independent of terminology changes. | Semantic Entity | semantic governance | semantic ID | term string | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.7 |
| VPR-VOC-014 | Supersession | Governed replacement of a semantic entity when meaning materially changes. | Semantic Governance Decision | versioning | semantic replacement | alias | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.7 |
| VPR-VOC-015 | Alias | Alternate terminology resolving to one existing semantic identity without changing meaning. | Vocabulary Alias | vocabulary | synonym | replacement | VPR Semantic Governance Authority | `1.0.0` | CANONICAL | VPR.7 |

Aliases do not create second semantic identities. Deprecated or superseded terminology remains resolvable for historical replay.

## Canonical Platform Ontology

Ontology domains:

| Domain ID | Domain | Governs |
| --- | --- | --- |
| VPR-ONT-001 | Identity | Identities, namespaces, identity lineage, identity authority. |
| VPR-ONT-002 | Registry | Registry entries, metadata, references, schemas, supersession. |
| VPR-ONT-003 | Governance | Governance decisions, policy evaluation, constitutional review, fail-closed outcomes. |
| VPR-ONT-004 | Policy | Policy packages, policy providers, policy inheritance, policy compatibility. |
| VPR-ONT-005 | Authority | Authority grants, scopes, delegation, escalation, approval boundaries. |
| VPR-ONT-006 | Ownership | Constitutional ownership, implementation ownership, lifecycle ownership, stewardship. |
| VPR-ONT-007 | Certification and Qualification | Qualification records, certification gates, validators, certification evidence. |
| VPR-ONT-008 | Evidence, Replay, Audit, Lineage | Evidence records, replay records, audit records, provenance, hash lineage. |
| VPR-ONT-009 | Configuration and Secrets | Config objects, secret references, rotation, distribution, access governance. |
| VPR-ONT-010 | Workflow, Eventing, Messaging, Scheduling | Workflows, states, events, messages, jobs, deterministic execution. |
| VPR-ONT-011 | Search, API, Resource, Storage | Query indexes, APIs, resource allocation, object storage. |
| VPR-ONT-012 | Tenancy, Security, Trust | Tenant capabilities, tenant isolation, trust zones, security boundaries. |
| VPR-ONT-013 | Observability, Resilience, Lifecycle, Deployment | Telemetry, lifecycle states, deployment units, resilience records. |
| VPR-ONT-014 | Platform Extension, Compatibility, Versioning | Extension points, semantic versions, compatibility classes, migration. |

Ontology requirements:

- Every entity resolves to one canonical entity class unless an approved multi-class rule exists.
- Every relationship resolves to one canonical relationship type.
- Entity classification is based on constitutional role, not implementation technology.
- Ontology extensions use approved extension points and cannot redefine core semantics.
- Programs may instantiate ontology entities but cannot redefine ontology meaning.

## Entity Type Registry

| Entity Type ID | Canonical name | Definition | Domain | Required attributes | Allowed relationships | Prohibited relationships |
| --- | --- | --- | --- | --- | --- | --- |
| VPR-ENT-001 | Constitutional Framework | Authority framework defining constitutional guarantees and governance constraints. | governance | owner, version, authority, evidence | GOVERNS, AUTHORIZES, CERTIFIES | DEPENDS_ON application |
| VPR-ENT-002 | Platform Capability | Discovered reusable infrastructure capability. | qualification | capability ID, owner, classification, lineage | QUALIFIES, DEPENDS_ON, SUPERSEDES | OWNED_BY application owner |
| VPR-ENT-003 | Platform Service | CCI-owned service exposing canonical contracts. | service | service ID, owner, contract, dependencies | IMPLEMENTS, PROVIDES, CONSUMES | INHERITS_FROM tenant |
| VPR-ENT-004 | Infrastructure Component | Single implementation framework supporting one or more platform services. | infrastructure | component ID, lifecycle owner, services | IMPLEMENTS, CONTAINS | OWNS constitutional authority |
| VPR-ENT-005 | API | Version-governed interface exposed by a platform service. | API infrastructure | API ID, contract, owner, version | PROVIDES, VALIDATES, REFERENCES | GOVERNS owner |
| VPR-ENT-006 | Contract | Canonical agreement governing interface use. | contract | contract ID, owner, version, compatibility | GOVERNS, VALIDATES, SUPERSEDES | ALIASES incompatible target |
| VPR-ENT-007 | Schema | Versioned structure for request, response, event, command, or query payload. | registry | schema ID, version, owner | IMPLEMENTS, VALIDATES | OWNS service |
| VPR-ENT-008 | Policy | Governed rule package evaluated by governance services. | policy | policy ID, scope, owner, version | GOVERNS, AUTHORIZES, INHERITS_FROM | IMPLEMENTS service |
| VPR-ENT-009 | Governance Authority | Entity authorized to govern platform decisions. | authority | authority ID, scope, grantor | AUTHORIZES, GOVERNS | OWNS by implication |
| VPR-ENT-010 | Ownership Authority | Entity with exclusive ownership over canonical definition and lifecycle. | ownership | owner ID, scope, jurisdiction | OWNS, SUPERSEDES | EXECUTES by implication |
| VPR-ENT-011 | Validator | Entity that validates contracts, constraints, or certifications. | validation | validator ID, version, contract | VALIDATES, PRODUCES_EVIDENCE_FOR | CERTIFIES unless approved |
| VPR-ENT-012 | Certification Gate | Governed gate that certifies readiness or compliance. | certification | gate ID, criteria, evidence | CERTIFIES, REQUIRES | IMPLEMENTS platform service |
| VPR-ENT-013 | Evidence Record | Immutable evidence supporting a decision. | evidence | evidence ID, source, hash, lineage | PRODUCES_EVIDENCE_FOR, REFERENCES | MUTATES |
| VPR-ENT-014 | Replay Record | Immutable replay reference or result. | replay | replay ID, inputs, result, hash | REPLAYS, VALIDATES | READS live source |
| VPR-ENT-015 | Audit Record | Append-only audit event. | audit | audit ID, actor, action, hash | AUDITS, REFERENCES | SUPERSEDES by deletion |
| VPR-ENT-016 | Workflow | Governed stateful process. | workflow | workflow ID, states, transitions | EMITS, CONSUMES, REPLAYS | OWNS platform service |
| VPR-ENT-017 | Event | Persisted event envelope. | eventing | event ID, type, source, schema | EMITS, SUBSCRIBES_TO, PERSISTS | AUTHORIZES |
| VPR-ENT-018 | Dependency | Directional dependency between entities. | dependency | dependency ID, source, target, strength | DEPENDS_ON, REQUIRES | INHERITS_FROM |
| VPR-ENT-019 | Extension Point | Governed platform extension interface. | extension | extension ID, host, contract | EXTENDS, IMPLEMENTS | REDEFINES host semantics |
| VPR-ENT-020 | Tenant Capability | Tenant-specific configuration or behavior. | tenancy | tenant ID, application scope | CONSUMES, CONFIGURES | GOVERNS platform |
| VPR-ENT-021 | Application Capability | Program-specific application behavior. | application | application ID, program owner | CONSUMES, COMPOSES | OWNS platform infrastructure |
| VPR-ENT-022 | Secret Reference | Reference to secret material without exposing value. | secrets | secret ref, scope, policy | REFERENCES, AUDITS | PERSISTS plaintext |
| VPR-ENT-023 | Resource | Allocatable platform resource. | resource | resource ID, quota, capacity | ALLOCATES, CONSUMES | AUTHORIZES |
| VPR-ENT-024 | Deployment Unit | Deployable service or component package. | deployment | unit ID, service, version | IMPLEMENTS, DEPENDS_ON | GOVERNS |

## Semantic Relationship Registry

| Relationship ID | Name | Meaning | Source types | Target types | Directionality | Cardinality | Invalid combinations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VPR-REL-001 | OWNS | Source has exclusive responsibility for canonical definition and lifecycle. | Ownership Authority | Capability, Service, Contract, Schema | Directed | One owner per reusable platform entity | OWNS plus ALIASES same target |
| VPR-REL-002 | GOVERNS | Source provides rules or governance over target. | Constitutional Framework, Policy, Governance Authority | Platform entity | Directed | Many policies allowed | GOVERNS by tenant over platform |
| VPR-REL-003 | AUTHORIZES | Source grants scoped authority to target. | Governance Authority | Entity, Operation | Directed | Scoped many-to-many | AUTHORIZES without scope |
| VPR-REL-004 | INHERITS_FROM | Source receives approved semantic constraints from target. | Lower layer entity | Higher layer or parent framework | Directed | Acyclic | INHERITS_FROM dependency without inheritance rule |
| VPR-REL-005 | EXTENDS | Source extends target through approved extension point. | Extension implementation | Extension point | Directed | Many extensions per point | EXTENDS platform internals |
| VPR-REL-006 | IMPLEMENTS | Source implementation realizes target contract or service. | Component, Deployment Unit | Contract, Service | Directed | Many implementations only when approved | IMPLEMENTS implies OWNS |
| VPR-REL-007 | DEPENDS_ON | Source relies on target. | Any non-constitutional entity | Provider entity | Directed | Acyclic for required dependencies | DEPENDS_ON implies INHERITS_FROM |
| VPR-REL-008 | REQUIRES | Source cannot certify or activate without target. | Entity, Contract, Gate | Evidence, Dependency, Contract | Directed | Many-to-many | REQUIRES undefined entity |
| VPR-REL-009 | PROVIDES | Source exposes target capability or interface. | Service, Framework | API, Contract, Extension | Directed | One provider per canonical platform contract | PROVIDES duplicate platform contract |
| VPR-REL-010 | CONSUMES | Source uses target through contract. | Application, Tenant, Framework | Platform Service, API | Directed | Many-to-many | CONSUMES transfers ownership |
| VPR-REL-011 | COMPOSES | Source assembles targets without owning their semantics. | Application, Framework | Service, API, Workflow | Directed | Many-to-many | COMPOSES implies OWNS |
| VPR-REL-012 | CONTAINS | Source structurally contains target. | Component, Registry, Package | Entity | Directed | Many-to-many | CONTAINS implies authority |
| VPR-REL-013 | REFERENCES | Source points to target without ownership transfer. | Any entity | Any entity | Directed | Many-to-many | REFERENCES as dependency substitute |
| VPR-REL-014 | VALIDATES | Source checks target against rules. | Validator, Gate | Contract, Entity, Evidence | Directed | Many validators allowed | VALIDATES implies CERTIFIES |
| VPR-REL-015 | CERTIFIES | Source issues certification for target. | Certification Gate | Entity, Contract, Dependency | Directed | Governed many-to-many | CERTIFIES without evidence |
| VPR-REL-016 | QUALIFIES | Source qualification decision classifies target. | Qualification Record | Capability, Service | Directed | One active qualification per target | QUALIFIES without lineage |
| VPR-REL-017 | PRODUCES_EVIDENCE_FOR | Source creates evidence supporting target. | Evidence producer | Decision, Certification, Validation | Directed | Many-to-many | Evidence without hash |
| VPR-REL-018 | SUPERSEDES | Source replaces target due to material semantic change. | Entity, Contract, Vocabulary | Same class target | Directed | Acyclic | SUPERSEDES and ALIASES same target |
| VPR-REL-019 | ALIASES | Source term resolves to target semantic identity. | Vocabulary term | Semantic entity | Directed | Many aliases to one identity | Alias changes meaning |
| VPR-REL-020 | COMPATIBLE_WITH | Source can interoperate with target under declared constraints. | Entity, Version, Contract | Entity, Version, Contract | Directed unless declared symmetric | Many-to-many | Compatibility inferred from name |
| VPR-REL-021 | CONFLICTS_WITH | Source conflicts semantically with target. | Any semantic entity | Any semantic entity | Directed evidence, symmetric consequence | Many-to-many | Auto-resolution |
| VPR-REL-022 | REPLAYS | Source reconstructs target historical state. | Replay Record, Replay Service | Entity, Decision, Contract | Directed | Many-to-many | Replay from live source |
| VPR-REL-023 | AUDITS | Source records audit evidence for target. | Audit Record, Audit Service | Entity, Operation | Directed | Many-to-many | Mutable audit |
| VPR-REL-024 | EMITS | Source emits target event. | Service, Workflow | Event | Directed | Many-to-many | Non-persisted required event |
| VPR-REL-025 | SUBSCRIBES_TO | Source subscribes to target event stream. | Service, Extension | Event | Directed | Many-to-many | Subscription without authorization |
| VPR-REL-026 | PERSISTS | Source stores target immutably. | Storage Service, Event Bus | Object, Event, Evidence | Directed | Many-to-many | Persistence with mutation |
| VPR-REL-027 | INSTANTIATES | Source creates an instance of target framework or contract. | Application, Tenant | Framework, Contract | Directed | Many-to-one | Instantiation redefines framework |
| VPR-REL-028 | ROUTES_TO | Source routes messages, events, or requests to target. | Gateway, Event Bus | Service, Consumer | Directed | Many-to-many | Routing bypasses policy |

## Inheritance Semantics Model

Inheritance layers:

```text
Constitutional Layer
  -> Platform Layer
  -> Framework Layer
  -> Application Layer
  -> Tenant Layer
```

Inheritance types:

| Type | Meaning | Rule |
| --- | --- | --- |
| Contract inheritance | Lower layer adopts approved interface obligations. | Cannot weaken required fields or error semantics. |
| Governance inheritance | Lower layer inherits constitutional guarantees. | May restrict, never broaden authority. |
| Policy inheritance | Lower layer inherits platform policy. | Tenant policy may tighten, not weaken. |
| Schema inheritance | Lower layer adopts parent schema version. | Incompatible schema changes require migration. |
| Validation inheritance | Lower layer inherits validators. | Cannot bypass required validators. |
| Certification inheritance | Lower layer reuses certification evidence. | Requires compatibility and evidence validation. |
| Lifecycle inheritance | Lower layer adopts lifecycle states. | Cannot skip mandatory approval/certification states. |
| Evidence obligation inheritance | Lower layer inherits evidence requirements. | Evidence completeness remains mandatory. |
| Replay obligation inheritance | Lower layer inherits replay duties. | Live reads remain prohibited. |
| Compatibility inheritance | Lower layer inherits compatibility constraints. | Authority or ownership expansion is never minor-compatible. |

Invalid inheritance:

- circular inheritance;
- cross-layer authority escalation;
- identity rewriting;
- ownership duplication;
- incompatible schema inheritance;
- weakened governance constraints;
- uncertified parent dependency;
- inheritance from superseded definitions without compatibility approval.

## Dependency Semantics Model

Dependency classes:

| Class | Meaning |
| --- | --- |
| Constitutional dependency | Reliance on constitutional authority or doctrine. |
| Governance dependency | Reliance on governance or policy evaluation. |
| Runtime dependency | Service requires provider during runtime. |
| Data dependency | Consumer requires provider data or evidence. |
| Schema dependency | Consumer requires provider schema. |
| API dependency | Consumer calls provider API. |
| Service dependency | Consumer requires provider service. |
| Infrastructure dependency | Consumer relies on shared infrastructure component. |
| Certification dependency | Certification requires provider evidence or validation. |
| Qualification dependency | Qualification requires provider classification or evidence. |
| Evidence dependency | Consumer requires evidence record. |
| Replay dependency | Consumer requires replay record or service. |
| Deployment dependency | Deployment requires provider version or unit. |
| Operational dependency | Operations require provider health, capacity, or telemetry. |
| Optional integration dependency | Provider improves behavior but is not mandatory. |

Dependency failure policies:

- `FAIL_CLOSED`
- `DEGRADE_WITHIN_CONTRACT`
- `RETRY_DETERMINISTICALLY`
- `ROUTE_TO_APPROVED_ALTERNATE`
- `REQUIRE_OPERATOR_REVIEW`
- `REQUIRE_GOVERNANCE_REVIEW`

Dependency is distinct from ownership and inheritance. Runtime dependency does not grant constitutional ownership. Required dependencies must declare deterministic failure behavior and certification evidence.

## Ownership Semantics Model

Ownership types:

| Type | Meaning |
| --- | --- |
| Constitutional ownership | Exclusive ownership of canonical platform meaning and lifecycle. |
| Platform capability ownership | Ownership of reusable platform capability scope. |
| Implementation ownership | Responsibility for implementation stewardship. |
| Service ownership | Ownership of service boundary and lifecycle. |
| Schema ownership | Ownership of schema evolution and compatibility. |
| Registry ownership | Ownership of registry semantics and records. |
| Policy ownership | Ownership of policy package lifecycle. |
| Operational ownership | Responsibility for operating deployed service. |
| Evidence ownership | Stewardship of evidence records and provenance. |
| Data stewardship | Stewardship of data purpose, retention, and quality. |
| Tenant ownership | Tenant control of tenant-specific configuration and state. |
| Lifecycle ownership | Responsibility for lifecycle state transitions. |

Constitutional rule: platform ownership is exclusive.

Consumption does not transfer ownership. Implementation does not transfer ownership. Delegation is not ownership transfer. Shared contribution does not create shared constitutional ownership. Duplicate ownership claims produce `OWNERSHIP_CONFLICT`.

## Authority Semantics Model

Authority types:

| Type | Meaning |
| --- | --- |
| Constitutional authority | Authority to define or amend constitutional platform constraints. |
| Governance authority | Authority to make governance decisions. |
| Policy authority | Authority to approve or update policy packages. |
| Certification authority | Authority to certify readiness or compliance. |
| Qualification authority | Authority to qualify capabilities for service promotion. |
| Approval authority | Authority to approve scoped changes or operations. |
| Operational authority | Authority to operate services within scope. |
| Execution authority | Authority to execute actions. |
| Advisory authority | Authority to recommend without execution. |
| Escalation authority | Authority to escalate or require review. |
| Exception authority | Authority to grant governed exceptions. |
| Tenant authority | Tenant-scoped authority subordinate to platform authority. |

Authority boundaries:

```text
OWNS != GOVERNS != AUTHORIZES != IMPLEMENTS != EXECUTES != ADVISES != CERTIFIES
```

Authority is explicitly granted, scoped, and replayable. Ownership does not imply execution authority. Advisory systems have no execution authority. Undefined authority fails closed. Conflicting authority assignments produce `AUTHORITY_CONFLICT`.

## Semantic Constraint Registry

| Constraint ID | Constraint | Violation |
| --- | --- | --- |
| VPR-SC-001 | A `PLATFORM_CAPABILITY` has exactly one constitutional owner. | `OWNERSHIP_CONFLICT` |
| VPR-SC-002 | A `TENANT_CAPABILITY` shall not govern a `PLATFORM_CAPABILITY`. | `AUTHORITY_CONFLICT` |
| VPR-SC-003 | An `ADVISORY_SERVICE` shall not possess `EXECUTION_AUTHORITY`. | `AUTHORITY_CONFLICT` |
| VPR-SC-004 | A program may `CONSUME` a platform service but shall not `OWN` it. | `OWNERSHIP_CONFLICT` |
| VPR-SC-005 | A framework extension shall `INHERIT_FROM` an approved framework version. | `INVALID_INHERITANCE` |
| VPR-SC-006 | A certification gate shall reference all required certification dependencies. | `SEMANTIC_LINEAGE_FAILURE` |
| VPR-SC-007 | A required dependency shall declare deterministic failure behavior. | `DEPENDENCY_SEMANTICS_VIOLATION` |
| VPR-SC-008 | An entity shall not simultaneously `SUPERSEDE` and `ALIAS` the same target. | `SEMANTIC_CONFLICT` |
| VPR-SC-009 | A constitutional authority shall not inherit authority from a lower layer. | `INVALID_INHERITANCE` |
| VPR-SC-010 | A relationship shall not be inferred solely from naming similarity. | `UNDEFINED_RELATIONSHIP` |
| VPR-SC-011 | A semantic identity shall not be rewritten after approval. | `SEMANTIC_LINEAGE_FAILURE` |
| VPR-SC-012 | Cross-tenant dependencies require constitutional approval and isolation evidence. | `DEPENDENCY_SEMANTICS_VIOLATION` |

## Vocabulary Alias and Supersession Registry

| Registry ID | Type | Source term/entity | Canonical target or successor | Semantic delta | Compatibility | Governance status |
| --- | --- | --- | --- | --- | --- | --- |
| VPR-ALIAS-001 | Alias | reusable capability | VPR-VOC-001 Platform Capability | None | FULLY_COMPATIBLE | APPROVED |
| VPR-ALIAS-002 | Alias | shared service | VPR-VOC-002 Shared Platform Service | None | FULLY_COMPATIBLE | APPROVED |
| VPR-ALIAS-003 | Alias | platform owner | VPR-VOC-005 Constitutional Owner | None | FULLY_COMPATIBLE | APPROVED |
| VPR-ALIAS-004 | Alias | provider contract | VPR-VOC-010 Extension Point | Scoped to extension interfaces | CONDITIONALLY_COMPATIBLE | APPROVED |
| VPR-SUP-001 | Supersession | local registry | CCI Registry Service semantic identity | Local meaning replaced by platform registry semantics | MIGRATION_REQUIRED | PROPOSED |
| VPR-SUP-002 | Supersession | local workflow engine | CCI Workflow Engine semantic identity | Platform workflow semantics replace local infrastructure semantics | MIGRATION_REQUIRED | PROPOSED |
| VPR-SUP-003 | Supersession | local audit ledger | CCI Audit Ledger Service semantic identity | Platform audit semantics replace local platform ledger semantics | MIGRATION_REQUIRED | PROPOSED |

Alias rules:

- Aliases reference one canonical semantic identity.
- Aliases do not alter meaning or create ownership.
- Aliases remain resolvable during replay.
- Aliases declare scope and effective version.

Supersession rules:

- Material meaning changes create new semantic identities.
- Superseded entities remain immutable.
- Compatibility, migration obligations, source lineage, and approval are recorded.

## Semantic Compatibility Matrix

| Compatibility class | Meaning | Migration | Recertification |
| --- | --- | --- | --- |
| `FULLY_COMPATIBLE` | Same semantic identity and meaning. | Not required | Not required |
| `BACKWARD_COMPATIBLE` | New version can serve old consumers. | Optional | Delta certification |
| `FORWARD_COMPATIBLE` | Old version can tolerate new records. | Optional | Delta certification |
| `CONDITIONALLY_COMPATIBLE` | Compatible only under declared constraints. | Possibly required | Required for constrained scope |
| `MIGRATION_REQUIRED` | Meaning or structure changed materially. | Required | Required |
| `INCOMPATIBLE` | Cannot interoperate safely. | Required through new semantic identity | Required |
| `PROHIBITED` | Violates constitutional semantics. | Not allowed | Not certifiable |

Validation scopes:

| Scope | Rule |
| --- | --- |
| Entity type compatibility | Entity class changes require migration unless explicitly compatible. |
| Relationship compatibility | Direction, cardinality, and implications must remain valid. |
| Ownership continuity | Ownership expansion or transfer is never minor-compatible. |
| Authority continuity | Authority expansion requires governance approval. |
| Dependency compatibility | Dependency changes trigger compatibility analysis. |
| Inheritance compatibility | Parent semantic version must be approved and certified. |
| Replay compatibility | Historical replay uses semantic model active at original decision time. |

## Ontology Validation Engine

Input:

```text
semantic_entities
semantic_relationships
vocabulary_entries
alias_records
supersession_records
constraint_registry
compatibility_records
lineage_refs
```

Validation outcomes:

- `VALID`
- `VALID_WITH_WARNINGS`
- `SEMANTIC_CONFLICT`
- `UNDEFINED_ENTITY`
- `UNDEFINED_RELATIONSHIP`
- `INVALID_CARDINALITY`
- `INVALID_INHERITANCE`
- `DEPENDENCY_SEMANTICS_VIOLATION`
- `OWNERSHIP_CONFLICT`
- `AUTHORITY_CONFLICT`
- `SEMANTIC_COMPATIBILITY_FAILURE`
- `SEMANTIC_LINEAGE_FAILURE`
- `REQUIRES_GOVERNANCE_REVIEW`

Validation rules:

- Undefined semantics fail closed.
- The validator does not silently normalize conflicting meaning.
- Relationship directionality and cardinality are enforced.
- Ownership uniqueness and authority scope are mandatory.
- Validation results produce evidence and are replayable.

## Semantic Lineage Graph

Lineage path:

```text
Mission Control Source
  -> Discovered Capability
  -> Normalized Semantic Entity
  -> Canonical Vocabulary Entry
  -> Ontology Classification
  -> Governed Relationships
  -> Platform Requirement
  -> CCI Implementation
  -> Certification Evidence
```

| Lineage ID | Concept | Mission Control source | VPR normalization | Canonical semantic entity | CCI reference | Certification evidence |
| --- | --- | --- | --- | --- | --- | --- |
| VPR7-LIN-001 | Platform service | Mission Control service directories and phase docs | VPR.1-VPR.3 | VPR-VOC-002, VPR-ENT-003 | CCI-SVC-001 through CCI-SVC-021 | VPR6-CERT-* |
| VPR7-LIN-002 | Platform ownership | Mission Control implementation ownership evidence | VPR.4 | VPR-VOC-005, VPR-ENT-010 | VPR4-OWN-* | Ownership uniqueness report |
| VPR7-LIN-003 | Dependency | Mission Control service imports and VPR dependency records | VPR.5 | VPR-VOC-007, VPR-ENT-018 | CCI-DEP-* | VPR5-RPL-* |
| VPR7-LIN-004 | Contract | Mission Control types, schemas, API routes | VPR.6 | VPR-VOC-009, VPR-ENT-006 | CCI-CON-* | Contract compliance matrix |
| VPR7-LIN-005 | Extension point | Mission Control plugin/provider patterns and VPR extension records | VPR.3-VPR.6 | VPR-VOC-010, VPR-ENT-019 | CCI-EXT-* | Extension certification records |
| VPR7-LIN-006 | Application boundary | Mission Control dashboards and intelligence services | VPR.1-VPR.4 | VPR-VOC-004, VPR-ENT-021 | APP-CON-* | Application conformance review |

Semantic lineage is immutable. Untraceable semantic entities fail platform readiness assessment.

## Semantic Governance Ledger

| Event ID | Event type | Affected semantic refs | Previous version | Resulting version | Decision authority | Outcome | Evidence refs | Replay refs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR7-GOV-001 | Governance contract approval | VPR.7 semantic governance contract | None | `1.0.0` | VPR Semantic Governance Authority | APPROVED_BASELINE | VPR.7 | VPR7-RPL-001 |
| VPR7-GOV-002 | Vocabulary registration | VPR-VOC-001 through VPR-VOC-015 | None | `1.0.0` | VPR Semantic Governance Authority | PROPOSED_FOR_CERTIFICATION | Shared Vocabulary Registry | VPR7-RPL-002 |
| VPR7-GOV-003 | Ontology registration | VPR-ONT-001 through VPR-ONT-014 | None | `1.0.0` | VPR Semantic Governance Authority | PROPOSED_FOR_CERTIFICATION | Canonical Platform Ontology | VPR7-RPL-003 |
| VPR7-GOV-004 | Entity type registration | VPR-ENT-001 through VPR-ENT-024 | None | `1.0.0` | VPR Semantic Governance Authority | PROPOSED_FOR_CERTIFICATION | Entity Type Registry | VPR7-RPL-004 |
| VPR7-GOV-005 | Relationship registration | VPR-REL-001 through VPR-REL-028 | None | `1.0.0` | VPR Semantic Governance Authority | PROPOSED_FOR_CERTIFICATION | Relationship Registry | VPR7-RPL-005 |
| VPR7-GOV-006 | Constraint registration | VPR-SC-001 through VPR-SC-012 | None | `1.0.0` | VPR Semantic Governance Authority | PROPOSED_FOR_CERTIFICATION | Semantic Constraint Registry | VPR7-RPL-006 |
| VPR7-GOV-007 | Alias and supersession registration | VPR-ALIAS-*, VPR-SUP-* | None | `1.0.0` | VPR Semantic Governance Authority | PROPOSED_FOR_CERTIFICATION | Alias and Supersession Registry | VPR7-RPL-007 |

Ledger entries are append-only. Historical semantic definitions are never rewritten.

## Semantic Conflict Governance

Conflict types:

- `TERM_COLLISION`
- `SEMANTIC_IDENTITY_COLLISION`
- `ENTITY_CLASSIFICATION_CONFLICT`
- `RELATIONSHIP_SEMANTICS_CONFLICT`
- `INHERITANCE_CONFLICT`
- `DEPENDENCY_SEMANTICS_CONFLICT`
- `OWNERSHIP_CONFLICT`
- `AUTHORITY_CONFLICT`
- `ALIAS_COLLISION`
- `SUPERSESSION_CONFLICT`
- `SEMANTIC_COMPATIBILITY_CONFLICT`
- `SEMANTIC_LINEAGE_FAILURE`
- `ONTOLOGY_EXTENSION_VIOLATION`

Conflict rules:

- Semantic conflicts never auto-resolve.
- Conflicting specifications cannot proceed to certification.
- Temporary aliases cannot conceal material semantic conflict.
- Remediation requires explicit governance decision.
- Resolution preserves all prior definitions, decisions, and lineage.

## Required Data Models

```text
SemanticEntityRecord
  semantic_entity_id
  canonical_name
  canonical_definition
  entity_type
  ontology_domain
  namespace
  semantic_version
  source_lineage_refs
  owning_authority
  governing_authority
  lifecycle_state
  compatibility_status
  certification_status
  integrity_hash

SemanticRelationshipRecord
  relationship_id
  relationship_type
  source_entity_id
  target_entity_id
  directionality
  cardinality
  transitive
  symmetric
  exclusive
  lifecycle_scope
  ownership_implication
  authority_implication
  dependency_strength
  compatibility_constraints
  evidence_refs
  integrity_hash

SemanticGovernanceDecision
  decision_id
  affected_semantic_refs
  decision_type
  previous_semantic_version
  resulting_semantic_version
  semantic_delta
  decision_authority
  decision_outcome
  compatibility_outcome
  conflict_refs
  evidence_refs
  replay_refs
  integrity_hash

SemanticCompatibilityRecord
  compatibility_record_id
  source_semantic_ref
  target_semantic_ref
  comparison_scope
  entity_compatibility
  relationship_compatibility
  ownership_continuity
  authority_continuity
  dependency_compatibility
  inheritance_compatibility
  replay_compatibility
  migration_required
  recertification_required
  compatibility_outcome
  evidence_refs
  integrity_hash
```

## Integration with Other VPR Phases

| Phase | Semantic governance integration |
| --- | --- |
| VPR.1 | Provides canonical classifications and vocabulary for discovered capabilities. |
| VPR.2 | Defines semantic equivalence, mergeability, supersession, and distinctness. |
| VPR.3 | Defines semantic boundaries between platform APIs, infrastructure components, extension points, application services, and tenant services. |
| VPR.4 | Defines ownership and authority semantics required for exclusive platform ownership. |
| VPR.5 | Defines dependency, inheritance, composition, consumption, ownership, and authority across architectural layers. |
| VPR.6 | Defines semantic identities and relationships referenced by platform contracts and compliance validation. |
| VPR.8+ | Later phases must use this vocabulary and ontology unless governance approves an amendment. |

## Validation Test Matrix

| Test | Expected |
| --- | --- |
| Canonical vocabulary entries uniquely identified | PASS |
| Canonical ontology domains defined | PASS |
| Entity types machine-verifiable | PASS |
| Entity relationships explicitly governed | PASS |
| Relationship directionality deterministic | PASS |
| Relationship cardinality enforced | PASS |
| Inheritance distinct from dependency | PASS |
| Dependency distinct from ownership | PASS |
| Ownership distinct from authority | PASS |
| Authority distinct from execution | PASS |
| Platform ownership exclusive | PASS |
| Required dependencies declare failure semantics | PASS |
| Circular inheritance detected | PASS |
| Dependency cycles detected | PASS |
| Authority escalation blocked | PASS |
| Advisory services prevented from acquiring execution authority | PASS |
| Alias mappings preserve canonical identity | PASS |
| Supersession preserves immutable lineage | PASS |
| Semantic compatibility deterministic | PASS |
| Semantic conflicts fail closed | PASS |
| Ontology extensions restricted to approved extension points | PASS |
| Historical semantic state replayable | PASS |
| CCI semantic lineage complete | PASS |
| Semantic governance ledger immutable | PASS |

## Required Certification Evidence

| Evidence | Status |
| --- | --- |
| Approved semantic governance contract | Baseline defined; approval pending. |
| Canonical vocabulary export | Defined in Shared Vocabulary Registry. |
| Ontology schema | Defined in Canonical Platform Ontology. |
| Entity type registry | Defined in Entity Type Registry. |
| Relationship registry | Defined in Semantic Relationship Registry. |
| Inheritance validation results | Defined in Validation Test Matrix. |
| Dependency validation results | Defined by VPR.5 and Dependency Semantics Model. |
| Ownership uniqueness report | Defined by VPR.4 and Ownership Semantics Model. |
| Authority boundary report | Defined by Authority Semantics Model. |
| Semantic compatibility matrix | Defined in Semantic Compatibility Matrix. |
| Alias and supersession report | Defined in Alias and Supersession Registry. |
| Semantic conflict report | Defined in Semantic Conflict Governance. |
| Ontology validation results | Defined in Ontology Validation Engine. |
| Semantic lineage graph | Defined in Semantic Lineage Graph. |
| Ledger integrity verification | Defined in Semantic Governance Ledger. |
| Deterministic replay results | Pending validator implementation. |
| Unresolved semantic divergence report | No unresolved divergence in baseline; future conflicts append to ledger. |
| Governance approval records | Pending constitutional approval. |
| CCI mapping evidence | Defined in lineage graph and VPR.3-VPR.6 references. |

## Exit Criteria Assessment

| Exit criterion | Status |
| --- | --- |
| Canonical vocabulary established | Satisfied in Shared Vocabulary Registry. |
| Platform ontology complete | Satisfied in Canonical Platform Ontology. |
| Entity identities deterministic | Satisfied through SemanticEntityRecord and entity registry. |
| Entity classifications deterministic | Satisfied through Entity Type Registry. |
| Entity relationships explicitly governed | Satisfied through Semantic Relationship Registry. |
| Inheritance semantics deterministic | Satisfied in Inheritance Semantics Model. |
| Dependency semantics deterministic | Satisfied in Dependency Semantics Model. |
| Ownership semantics exclusive and enforceable | Satisfied in Ownership Semantics Model. |
| Authority semantics explicit and scoped | Satisfied in Authority Semantics Model. |
| Ownership separated from authority | Satisfied by authority boundary definitions. |
| Authority separated from execution | Satisfied by authority taxonomy and constraints. |
| Aliases preserve canonical identity | Satisfied in Alias Registry. |
| Supersession preserves immutable lineage | Satisfied in Supersession Registry. |
| Semantic compatibility machine-verifiable | Satisfied in compatibility matrix. |
| Ontology constraints enforceable | Satisfied in Semantic Constraint Registry. |
| Semantic conflicts fail closed | Satisfied in Semantic Conflict Governance. |
| Semantic governance decisions produce evidence | Satisfied in Semantic Governance Ledger. |
| Historical semantic states replayable | Satisfied as model; validator implementation pending. |
| Mission Control concepts map deterministically into VPR | Satisfied through semantic lineage graph. |
| VPR semantic definitions map deterministically into CCI | Satisfied through CCI references. |
| Semantic lineage complete | Satisfied for baseline. |
| VPR.7 certification passes | Pending certification execution. |

VPR.7 is complete as a vocabulary and semantic governance baseline. It defines what Civitas platform concepts are, how they relate, what they inherit, what they depend upon, who owns them, and which authority may govern or act upon them.
