# VPR.4 - Infrastructure Boundary Definition

Status: boundary baseline

Predecessors:

- [VPR.1 - Platform Capability Discovery](./vpr-1-platform-capability-discovery.md)
- [VPR.2 - Shared Service Qualification](./vpr-2-shared-service-qualification.md)
- [VPR.3 - Service Decomposition](./vpr-3-service-decomposition.md)

Produces:

- VPR.5 - Platform Contract Definition
- VPR.6 - Reference Platform Architecture
- CCI Platform Architecture
- CCI Ownership Model
- CCI Implementation Backlog

## Purpose

VPR.4 defines the constitutional boundaries between Civitas Core Infrastructure (CCI) platform services and application-specific capabilities extracted from Mission Control.

This phase establishes authoritative ownership for reusable infrastructure, prevents duplicate platform implementations across the Civitas ecosystem, defines platform extension boundaries, and provides implementation-ready ownership inputs for CCI.

## Infrastructure Boundary Model

The CCI boundary is the constitutional line between reusable infrastructure and application behavior.

Inside the boundary:

- CCI implements shared infrastructure once.
- CCI owns canonical service contracts.
- CCI governs extension points.
- CCI enforces identity, governance, policy, certification, audit, replay, registry, storage, messaging, eventing, workflow, search, scheduling, configuration, secrets, API infrastructure, resource management, observability, telemetry, security, trust, and lifecycle management.
- CCI preserves immutable ownership lineage.

Outside the boundary:

- Programs implement application-specific workflows, dashboards, intelligence, recommendations, mission strategy, tenant-specific local behavior, and product presentation.
- Programs consume CCI services through published APIs and approved extension points.
- Programs may configure, extend, and compose platform services, but may not duplicate, fork, redefine, or bypass them.

Boundary decisions are not inferred from implementation location. A service implemented in Mission Control may still be platform infrastructure after qualification; a service with platform-like naming may still remain an application capability if it is mission-specific.

## Infrastructure Classification Rules

| Classification | Rule | Implementation authority | Extension posture |
| --- | --- | --- | --- |
| Platform Infrastructure | Reusable by multiple programs, constitutionally owned, and implemented by CCI. | CCI only. | Extension only through approved extension points. |
| Shared Platform Service | Published CCI service with stable APIs and governed contracts. | CCI owns core; programs consume. | Approved provider or strategy extension allowed. |
| Application Capability | Mission-specific behavior owned by originating program. | Originating program. | May consume platform services; does not extend platform internals. |
| Local Implementation | Program-owned local support implementation. | Program or tenant implementation owner. | May be replaced by CCI service after future qualification. |

Every capability is evaluated for reuse potential, ownership uniqueness, dependency stability, platform suitability, implementation maturity, operational evidence, certification readiness, governance compatibility, and constitutional compliance.

## Ownership Lifecycle

```text
DISCOVERED
  -> UNDER_REVIEW
  -> QUALIFIED
  -> OWNED
  -> ACTIVE
  -> SUPERSEDED
  -> ARCHIVED
```

Ownership lineage remains immutable across lifecycle changes. Supersession creates a new ownership record and never removes historical references.

## Platform Ownership Registry

| Service | Classification | Constitutional owner | Owning program | Owning organization | Scope | Contract reference | Extension references | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CCI-SVC-001 Identity Service | Shared Platform Service | CCI Identity Steward | CCI | Civitas Platform | Platform-wide identity, namespaces, lineage | CCI-API-001 | Authentication Providers through CCI-EXT-007 as consumers only | OWNED |
| CCI-SVC-002 Registry Service | Shared Platform Service | CCI Registry Steward | CCI | Civitas Platform | Service, metadata, reference, schema registry | CCI-API-002 | API Extensions CCI-EXT-011 may register endpoints | OWNED |
| CCI-SVC-003 Governance Service | Platform Infrastructure | Constitutional Governance Steward | CCI | Civitas Platform | Governance, policy, authority, fail-closed decisions | CCI-API-003 | Policy Providers CCI-EXT-001, Authority Providers CCI-EXT-002 | OWNED |
| CCI-SVC-004 Replay Service | Platform Infrastructure | Replay Steward | CCI | Civitas Platform | Deterministic replay, replay validation, replay evidence | CCI-API-004 | Event Processors CCI-EXT-004 provide replayable outputs | OWNED |
| CCI-SVC-005 Audit Ledger Service | Platform Infrastructure | Audit Ledger Steward | CCI | Civitas Platform | Immutable audit, ledger, hash, integrity, tamper evidence | CCI-API-005 | No direct extension; audit adapters require constitutional review | OWNED |
| CCI-SVC-006 Evidence Storage Service | Platform Infrastructure | Storage Steward | CCI | Civitas Platform | Immutable storage, object persistence, retention, storage governance | CCI-API-006 | Storage Providers CCI-EXT-006 | UNDER_REVIEW |
| CCI-SVC-007 Event Bus | Platform Infrastructure | Event Steward | CCI | Civitas Platform | Event routing, subscriptions, persistence, event replay handoff | CCI-API-007 | Event Processors CCI-EXT-004 | UNDER_REVIEW |
| CCI-SVC-008 Observability Service | Shared Platform Service | Observability Steward | CCI | Civitas Platform | Metrics, telemetry, inspection, visibility contracts | CCI-API-008 | Observability Providers CCI-EXT-014 | OWNED |
| CCI-SVC-009 Trust Boundary Service | Platform Infrastructure | Trust Boundary Steward | CCI | Civitas Platform | Tenant isolation, trust zones, access boundaries, privacy enforcement | CCI-API-009 | Authorization Providers CCI-EXT-008 may consume boundary decisions | OWNED |
| CCI-SVC-010 Certification Service | Shared Platform Service | Certification Steward | CCI | Civitas Platform | Certification kernel, validator registry, certification replay | CCI-API-010 | Certification Validators CCI-EXT-013 | OWNED |
| CCI-SVC-011 Configuration Service | Shared Platform Service | Configuration Steward | CCI | Civitas Platform | Configuration registry, versioning, distribution, validation, lineage | CCI-API-011 | Configuration Providers CCI-EXT-015 | UNDER_REVIEW |
| CCI-SVC-012 Secrets Manager | Platform Infrastructure | Security Steward | CCI | Civitas Platform | Secret references, credential distribution, rotation, access audit | CCI-API-012 | Secret Backends CCI-EXT-016 | UNDER_REVIEW |
| CCI-SVC-013 Workflow Engine | Shared Platform Service | Workflow Steward | CCI | Civitas Platform | Workflow definitions, state transitions, compensation, workflow replay | CCI-API-013 | Workflow Extensions CCI-EXT-003 | OWNED |
| CCI-SVC-014 Search and Query Service | Shared Platform Service | Query Steward | CCI | Civitas Platform | Search, indexing, query processing, federation, result lineage | CCI-API-014 | Search Providers CCI-EXT-005 | OWNED |
| CCI-SVC-015 Scheduler | Platform Infrastructure | Scheduling Steward | CCI | Civitas Platform | Jobs, timers, recurrence, deterministic execution, schedule policy | CCI-API-015 | Scheduler Extensions CCI-EXT-009 | UNDER_REVIEW |
| CCI-SVC-016 API Gateway and Registry | Platform Infrastructure | API Platform Steward | CCI | Civitas Platform | Gateway, endpoint registry, routing, auth integration, rate policy | CCI-API-016 | API Extensions CCI-EXT-011, Authentication Providers CCI-EXT-007 | UNDER_REVIEW |
| CCI-SVC-017 Resource Manager | Shared Platform Service | Resource Steward | CCI | Civitas Platform | Resource allocation, capacity, quota enforcement, lifecycle | CCI-API-017 | Resource Allocation Strategies CCI-EXT-010 | OWNED |
| CCI-SVC-018 Dependency Graph Service | Shared Platform Service | Dependency Steward | CCI | Civitas Platform | Graph primitives, blockers, cycles, ordering, dependency lineage | CCI-API-018 | Validation Providers CCI-EXT-012 may validate graph rules | OWNED |
| CCI-SVC-019 Contract Validation Service | Platform Infrastructure | Validation Steward | CCI | Civitas Platform | Validator registry, deterministic validation, error taxonomy | CCI-API-019 | Validation Providers CCI-EXT-012 | OWNED |
| CCI-SVC-020 Lineage Service | Platform Infrastructure | Lineage Steward | CCI | Civitas Platform | Provenance, parent-child references, transformation lineage, replay | CCI-API-020 | No mutation extensions; providers may submit lineage through API only | OWNED |
| CCI-SVC-021 Evidence Registry | Shared Platform Service | Evidence Steward | CCI | Civitas Platform | Evidence identity, classification, provenance, bindings, verification | CCI-API-021 | Certification Validators CCI-EXT-013 consume evidence | OWNED |
| CCI-SVC-022 Mission Control Visibility | Application Capability | Mission Control Product Steward | Mission Control | Originating program | UI, dashboards, panels, product visibility | Application View Contract | May consume CCI-API-008, CCI-API-014, CCI-API-003 | ACTIVE outside CCI |
| CCI-SVC-023 Recommendation Intelligence | Application Capability | Mission Intelligence Steward | Mission Control | Originating program | Recommendations, recommendation intelligence, application reasoning | Recommendation Application Contract | May consume governance, replay, evidence, query, audit | ACTIVE outside CCI |
| CCI-SVC-024 Mission Intelligence and Strategy | Application Capability | Mission Intelligence Steward | Mission Control | Originating program | Mission strategy, scenario analysis, strategic intelligence | Mission Intelligence Application Contract | May consume platform services only through contracts | ACTIVE outside CCI |

## Capability Ownership Matrix

| Capability domain | Platform owner | Application owner boundary | Ownership rationale | Dependency references | Lineage references |
| --- | --- | --- | --- | --- | --- |
| Identity | CCI Identity Steward | Programs own subject semantics only. | Identifier stability and namespace governance must be universal. | CCI-SVC-002, CCI-SVC-005, CCI-SVC-020 | VPR-PC-001, VPR-SS-001, CCI-SVC-001 |
| Governance | Constitutional Governance Steward | Programs own local business policy proposals, not constitutional evaluation. | Governance must be exclusive and fail-closed. | CCI-SVC-009, CCI-SVC-019, CCI-SVC-021 | VPR-PC-003, VPR-PC-004, VPR-PC-024, VPR-SS-003 |
| Policy | Constitutional Governance Steward | Programs may provide registered policy providers. | Policy evaluation is platform-owned; policy packages are extension-governed. | CCI-EXT-001, CCI-SVC-003 | VPR-PC-004, VPR-MRG-002 |
| Certification | Certification Steward | Programs own domain criteria, not certification kernel. | Certification evidence and replay must be uniform. | CCI-SVC-004, CCI-SVC-019, CCI-SVC-021 | VPR-PC-011, VPR-SS-010 |
| Audit | Audit Ledger Steward | Programs may read authorized records; they cannot write local platform ledgers. | Audit integrity requires one append-only authority. | CCI-SVC-001, CCI-SVC-020 | VPR-PC-006, VPR-PC-027, VPR-SS-005 |
| Replay | Replay Steward | Programs own replay scenarios, not replay framework. | Replay must be deterministic and implementation independent. | CCI-SVC-006, CCI-SVC-020, CCI-SVC-019 | VPR-PC-005, VPR-PC-015, VPR-SS-004 |
| Registry | CCI Registry Steward | Programs may register entries; they cannot own registry semantics. | Discovery, compatibility, and supersession must be canonical. | CCI-SVC-001, CCI-SVC-019, CCI-SVC-020 | VPR-PC-002, VPR-PC-026, VPR-SS-002 |
| Storage | Storage Steward | Programs own data purpose and retention requests, not storage framework. | Immutable storage needs one platform abstraction. | CCI-SVC-009, CCI-SVC-005, CCI-SVC-020 | VPR-PC-007, VPR-SS-006 |
| Messaging and eventing | Event Steward | Programs own event semantics; CCI owns bus, routing, subscription, persistence. | Event transport and replay must be common infrastructure. | CCI-SVC-002, CCI-SVC-004, CCI-SVC-008 | VPR-PC-008, VPR-SS-007 |
| Workflow | Workflow Steward | Programs own workflow definitions submitted through contracts. | Workflow engine and state transition framework are shared runtime infrastructure. | CCI-SVC-003, CCI-SVC-007, CCI-SVC-015 | VPR-PC-014, VPR-PC-025, VPR-SS-013 |
| Search | Query Steward | Programs own indexes and query intent, not query governance. | Authorization, lineage, and federation must be platform-owned. | CCI-SVC-002, CCI-SVC-021, CCI-SVC-020, CCI-SVC-009 | VPR-PC-016, VPR-SS-014 |
| Scheduling | Scheduling Steward | Programs submit jobs; CCI owns timing, recurrence, and execution policy. | Deterministic execution requires platform scheduling authority. | CCI-SVC-003, CCI-SVC-017, CCI-SVC-005 | VPR-PC-017, VPR-SS-015 |
| Configuration | Configuration Steward | Programs own config requests and values; CCI owns registry, versioning, validation, distribution. | Config must be lineage-bound and versioned. | CCI-SVC-002, CCI-SVC-019, CCI-SVC-003 | VPR-PC-012, VPR-SS-011 |
| Secrets | Security Steward | Programs own credential purpose; CCI owns references, rotation, distribution, audit. | Secret handling must be centralized and never exposed in evidence. | CCI-SVC-009, CCI-SVC-003, CCI-SVC-005 | VPR-PC-013, VPR-SS-012 |
| API infrastructure | API Platform Steward | Programs own feature handlers; CCI owns gateway, endpoint registry, routing, validation. | APIs require platform-level versioning and governance. | CCI-SVC-001, CCI-SVC-002, CCI-SVC-019 | VPR-PC-018, VPR-SS-016 |
| Resource management | Resource Steward | Programs own workload requests; CCI owns quotas, capacity, allocation. | Shared capacity requires single allocation authority. | CCI-SVC-015, CCI-SVC-003, CCI-SVC-008 | VPR-PC-019, VPR-SS-017 |
| Observability and telemetry | Observability Steward | Programs own dashboards; CCI owns telemetry contracts and inspection surfaces. | Telemetry must be consistent, auditable, and UI-independent. | CCI-SVC-007, CCI-SVC-005, CCI-SVC-014 | VPR-PC-009, VPR-PC-028 telemetry split, VPR-SS-008 |
| Security and trust | Trust Boundary Steward and Security Steward | Programs own local risk posture; CCI owns trust boundaries and secrets. | Isolation and credential control cannot be duplicated locally. | CCI-SVC-009, CCI-SVC-012 | VPR-PC-010, VPR-PC-013 |
| Lifecycle management | Workflow Steward | Programs own domain lifecycle definitions; CCI owns state transition framework. | State transition semantics must be replayable and governed. | CCI-SVC-013, CCI-SVC-005, CCI-SVC-004 | VPR-PC-025, VPR-SS-013 |

## Platform Responsibility Map

| Responsibility | CCI responsibility | Program responsibility | Prohibited behavior |
| --- | --- | --- | --- |
| Define platform contracts | Publish canonical APIs, schemas, compatibility, and error taxonomies. | Consume contracts and request changes through governance. | Local contract forks or hidden compatibility rules. |
| Operate shared infrastructure | Implement and maintain single CCI service instances. | Integrate through APIs and extension points. | Reimplementing platform services locally. |
| Govern extension points | Approve, version, certify, and audit extension contracts. | Implement extensions within approved contracts. | Extension mutation of platform internals. |
| Preserve lineage | Record ownership, dependency, evidence, replay, and supersession lineage. | Provide application evidence references. | Rewriting historical ownership or evidence. |
| Enforce replayability | Require deterministic replay or explicit replay blockers. | Provide immutable inputs and replay context. | Live reads during replay or non-deterministic reconstruction. |
| Validate boundaries | Enforce platform/application separation. | Avoid platform responsibilities in application code. | Ownership inference from file location. |

## Platform Consumption Model

Programs may:

- Consume platform capabilities through CCI APIs.
- Configure platform services through Configuration Service contracts.
- Extend approved extension points with registered providers.
- Compose platform capabilities through published interfaces.
- Submit evidence, workflows, policies, queries, jobs, and resource requests.
- Build application-specific dashboards and intelligence on top of platform contracts.

Programs shall never:

- Duplicate platform infrastructure.
- Fork platform services.
- Redefine constitutional ownership.
- Bypass platform contracts.
- Replace constitutional owners.
- Store secret material in replay or evidence bundles.
- Implement local audit, identity, registry, replay, governance, validation, lineage, or trust substitutes after CCI ownership is active.

## Platform Extension Boundary Registry

| Extension boundary | Extension point | Host owner | Allowed extension | Boundary limit | Ownership state |
| --- | --- | --- | --- | --- | --- |
| Policy extension boundary | CCI-EXT-001 Policy Providers | Constitutional Governance Steward | Registered policy providers with immutable versions. | Providers cannot bypass constitutional rules or fail-open. | OWNED |
| Authority extension boundary | CCI-EXT-002 Authority Providers | Constitutional Governance Steward | Authority resolvers with explicit scope. | Providers cannot expand authority without constitutional approval. | OWNED |
| Workflow extension boundary | CCI-EXT-003 Workflow Extensions | Workflow Steward | States, guards, and compensation hooks. | Extensions cannot mutate workflow engine internals or hide transitions. | OWNED |
| Event processing boundary | CCI-EXT-004 Event Processors | Event Steward | Event processors, routers, and subscribers. | Processors cannot create non-persisted events or bypass replay. | UNDER_REVIEW |
| Search provider boundary | CCI-EXT-005 Search Providers | Query Steward | Index providers and query adapters. | Providers cannot bypass authorization or result lineage. | OWNED |
| Storage provider boundary | CCI-EXT-006 Storage Providers | Storage Steward | Storage adapters preserving immutability. | Providers cannot classify evidence or mutate stored records. | UNDER_REVIEW |
| Authentication provider boundary | CCI-EXT-007 Authentication Providers | API Platform Steward | Authentication adapters. | Providers cannot own authorization or trust decisions. | UNDER_REVIEW |
| Authorization provider boundary | CCI-EXT-008 Authorization Providers | API Platform Steward and Constitutional Governance Steward | Authorization adapters consuming governance and trust. | Providers cannot bypass governance, policy, or trust boundary. | UNDER_REVIEW |
| Scheduler extension boundary | CCI-EXT-009 Scheduler Extensions | Scheduling Steward | Schedule policy and execution adapters. | Extensions cannot execute outside deterministic windows. | UNDER_REVIEW |
| Allocation strategy boundary | CCI-EXT-010 Resource Allocation Strategies | Resource Steward | Quota and capacity allocation strategies. | Strategies cannot override governance or capacity evidence. | OWNED |
| API extension boundary | CCI-EXT-011 API Extensions | API Platform Steward | Versioned endpoint extensions. | Extensions cannot skip registry, validation, or auth policy. | UNDER_REVIEW |
| Validation provider boundary | CCI-EXT-012 Validation Providers | Validation Steward | Deterministic validators. | Providers cannot reorder themselves or fail-open. | OWNED |
| Certification validator boundary | CCI-EXT-013 Certification Validators | Certification Steward | Certification validators and criteria modules. | Validators cannot mutate issued certification criteria. | OWNED |
| Observability provider boundary | CCI-EXT-014 Observability Providers | Observability Steward | Telemetry and inspection providers. | Providers cannot expose hidden product state or omit lineage. | OWNED |
| Configuration provider boundary | CCI-EXT-015 Configuration Providers | Configuration Steward | Configuration value providers and distribution adapters. | Providers cannot distribute unvalidated or lineage-free config. | UNDER_REVIEW |
| Secret backend boundary | CCI-EXT-016 Secret Backends | Security Steward | Secret storage and KMS backends. | Backends cannot expose secret material through APIs, audit, or replay. | UNDER_REVIEW |

## Ownership Decision Ledger

| Decision ID | Capability or service | Ownership classification | Constitutional owner | Implementation owner | Decision rationale | Supporting evidence | Replay references | Supersession references |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR4-OWN-001 | Identity Service | Shared Platform Service | CCI Identity Steward | CCI | Identity is reusable infrastructure and cannot be application-owned. | VPR-PC-001, VPR-SS-001, CCI-SVC-001 | CCI-API-001 lineage replay | None |
| VPR4-OWN-002 | Registry Service | Shared Platform Service | CCI Registry Steward | CCI | Registry, metadata, references, and schemas must have one canonical owner. | VPR-PC-002, VPR-PC-026, VPR-SS-002, VPR-MRG-001 | CCI-API-002 version replay | Supersedes local registry variants after CCI activation |
| VPR4-OWN-003 | Governance Service | Platform Infrastructure | Constitutional Governance Steward | CCI | Constitutional governance and authority resolution must be exclusive. | VPR-PC-003, VPR-PC-004, VPR-PC-024, VPR-SS-003 | CCI-API-003 governance replay | Supersedes program-local governance infrastructure |
| VPR4-OWN-004 | Replay Service | Platform Infrastructure | Replay Steward | CCI | Replay must be deterministic and implementation independent. | VPR-PC-005, VPR-PC-015, VPR-SS-004 | CCI-API-004 | Supersedes local replay engines after CCI activation |
| VPR4-OWN-005 | Audit Ledger Service | Platform Infrastructure | Audit Ledger Steward | CCI | Audit, integrity, and tamper evidence require one append-only authority. | VPR-PC-006, VPR-PC-027, VPR-SS-005 | CCI-API-005 hash-chain replay | Supersedes local platform ledgers |
| VPR4-OWN-006 | Evidence Storage Service | Platform Infrastructure | Storage Steward | CCI | Immutable storage is shared infrastructure but architecture remains under review. | VPR-PC-007, VPR-SS-006 | CCI-API-006 object hash replay | None |
| VPR4-OWN-007 | Event Bus | Platform Infrastructure | Event Steward | CCI | Event routing, persistence, and subscription must be centralized. | VPR-PC-008, VPR-SS-007 | CCI-API-007 event stream replay | Supersedes local event buses after CCI activation |
| VPR4-OWN-008 | Observability Service | Shared Platform Service | Observability Steward | CCI | Telemetry and inspection are platform-owned; dashboards are application-owned. | VPR-PC-009, VPR-PC-028 telemetry split, VPR-SS-008 | CCI-API-008 telemetry replay | Splits UI ownership to Mission Control Product Steward |
| VPR4-OWN-009 | Trust Boundary Service | Platform Infrastructure | Trust Boundary Steward | CCI | Trust and tenant isolation cannot be duplicated by programs. | VPR-PC-010, VPR-SS-009 | CCI-API-009 boundary replay | Supersedes local trust boundary implementations |
| VPR4-OWN-010 | Certification Service | Shared Platform Service | Certification Steward | CCI | Certification kernel is shared; domain gates remain program-owned. | VPR-PC-011, VPR-SS-010, VPR-MRG-007 | CCI-API-010 certification replay | Splits domain gates outside CCI core |
| VPR4-OWN-011 | Configuration Service | Shared Platform Service | Configuration Steward | CCI | Config registry, versioning, validation, and distribution must be canonical. | VPR-PC-012, VPR-SS-011 | CCI-API-011 config lineage replay | Supersedes local platform config registries after activation |
| VPR4-OWN-012 | Secrets Manager | Platform Infrastructure | Security Steward | CCI | Secret references, rotation, and distribution must be centralized. | VPR-PC-013, VPR-SS-012 | CCI-API-012 audit replay only | Supersedes local secret managers after approval |
| VPR4-OWN-013 | Workflow Engine | Shared Platform Service | Workflow Steward | CCI | Workflow engine is shared infrastructure; workflow definitions may be program-owned. | VPR-PC-014, VPR-PC-025, VPR-SS-013 | CCI-API-013 workflow replay | Supersedes local workflow engines after activation |
| VPR4-OWN-014 | Search and Query Service | Shared Platform Service | Query Steward | CCI | Query governance, indexes, federation, and result lineage are platform responsibilities. | VPR-PC-016, VPR-SS-014 | CCI-API-014 query replay | Supersedes local query infrastructure after activation |
| VPR4-OWN-015 | Scheduler | Platform Infrastructure | Scheduling Steward | CCI | Deterministic execution and recurrence must be platform-owned. | VPR-PC-017, VPR-SS-015 | CCI-API-015 schedule replay | Supersedes local platform schedulers after approval |
| VPR4-OWN-016 | API Gateway and Registry | Platform Infrastructure | API Platform Steward | CCI | Gateway, endpoint registry, routing, versioning, and request validation are platform infrastructure. | VPR-PC-018, VPR-SS-016 | CCI-API-016 request contract replay | Supersedes local gateway infrastructure after activation |
| VPR4-OWN-017 | Resource Manager | Shared Platform Service | Resource Steward | CCI | Capacity, quotas, and allocation require a shared authority. | VPR-PC-019, VPR-SS-017 | CCI-API-017 allocation replay | Supersedes local platform quota systems |
| VPR4-OWN-018 | Dependency Graph Service | Shared Platform Service | Dependency Steward | CCI | Graph primitives and dependency safety are shared infrastructure. | VPR-PC-020, VPR-SS-018 | CCI-API-018 graph replay | Splits decision-specific semantics outside CCI core |
| VPR4-OWN-019 | Contract Validation Service | Platform Infrastructure | Validation Steward | CCI | Deterministic validation and error taxonomy must be canonical. | VPR-PC-021, VPR-SS-019 | CCI-API-019 validation replay | Supersedes local platform validation engines |
| VPR4-OWN-020 | Lineage Service | Platform Infrastructure | Lineage Steward | CCI | Provenance and lineage must be immutable and shared. | VPR-PC-022, VPR-SS-020 | CCI-API-020 lineage replay | Supersedes local platform lineage stores |
| VPR4-OWN-021 | Evidence Registry | Shared Platform Service | Evidence Steward | CCI | Evidence identity, provenance, and binding are shared services. | VPR-PC-023, VPR-SS-021 | CCI-API-021 evidence replay | Splits scoring overlays outside CCI core |
| VPR4-OWN-022 | Mission Control Visibility | Application Capability | Mission Control Product Steward | Mission Control | UI and product visibility are application-owned. | VPR-PC-028, VPR-SS-022, CCI-SVC-022 | Consumes CCI replay; no platform replay ownership | Telemetry surfaces split to CCI-SVC-008 |
| VPR4-OWN-023 | Recommendation Intelligence | Application Capability | Mission Intelligence Steward | Mission Control | Recommendations are mission/application behavior. | VPR-PC-029, VPR-SS-023, CCI-SVC-023 | Consumes CCI replay; no platform replay ownership | None |
| VPR4-OWN-024 | Mission Intelligence and Strategy | Application Capability | Mission Intelligence Steward | Mission Control | Mission strategy is application/domain behavior. | VPR-PC-030, VPR-SS-024, CCI-SVC-024 | Consumes CCI replay; no platform replay ownership | None |

## Boundary Validation Report

| Validation ID | Boundary check | Result | Notes |
| --- | --- | --- | --- |
| VPR4-BV-001 | Infrastructure boundaries defined. | Pass | Boundary model separates CCI-owned services from application capabilities. |
| VPR4-BV-002 | Platform ownership explicit. | Pass | Ownership registry assigns owner, program, organization, scope, contract, extensions, and status. |
| VPR4-BV-003 | Ownership uniqueness verified. | Pass | Each reusable capability has one constitutional owner. |
| VPR4-BV-004 | Reusable capabilities classified. | Pass | Each service is classified as platform infrastructure, shared platform service, application capability, or local implementation by rule. |
| VPR4-BV-005 | Platform contracts referenced. | Pass | CCI API references are assigned for each platform service. |
| VPR4-BV-006 | Extension boundaries validated. | Pass | Extension Boundary Registry defines host owner, allowed extension, and limits. |
| VPR4-BV-007 | Duplicate platform ownership eliminated. | Pass | Platform ownership is exclusive; program-local implementations are consumers after activation. |
| VPR4-BV-008 | Ownership lineage complete. | Pass | Ownership decisions trace to VPR.1, VPR.2, and VPR.3 identifiers. |
| VPR4-BV-009 | Deterministic replay validated. | Conditional pass | Ready services include replay references; under-review services preserve replay blockers. |
| VPR4-BV-010 | Constitutional compliance verified. | Pass | Constitutional rules are mapped to ownership and consumption model. |
| VPR4-BV-011 | Implementation-ready ownership model approved. | Pending approval | This artifact is ready for constitutional approval review. |

## Infrastructure Lineage Ledger

| Lineage ID | Boundary decision | Discovery lineage | Qualification lineage | Decomposition lineage | Ownership record |
| --- | --- | --- | --- | --- | --- |
| VPR4-LIN-001 | Identity belongs inside CCI boundary. | VPR-PC-001 | VPR-SS-001 | CCI-SVC-001, CCI-API-001 | VPR4-OWN-001 |
| VPR4-LIN-002 | Registry and schema registry normalize inside CCI boundary. | VPR-PC-002, VPR-PC-026 | VPR-SS-002, VPR-MRG-001 | CCI-SVC-002, CCI-API-002 | VPR4-OWN-002 |
| VPR4-LIN-003 | Governance, policy, and authority belong inside CCI boundary. | VPR-PC-003, VPR-PC-004, VPR-PC-024 | VPR-SS-003, VPR-MRG-002 | CCI-SVC-003, CCI-API-003 | VPR4-OWN-003 |
| VPR4-LIN-004 | Replay and event replay profile belong inside CCI boundary. | VPR-PC-005, VPR-PC-015 | VPR-SS-004, VPR-MRG-003 | CCI-SVC-004, CCI-API-004 | VPR4-OWN-004 |
| VPR4-LIN-005 | Audit, ledger, integrity, and tamper detection belong inside CCI boundary. | VPR-PC-006, VPR-PC-027 | VPR-SS-005, VPR-MRG-004 | CCI-SVC-005, CCI-API-005 | VPR4-OWN-005 |
| VPR4-LIN-006 | Evidence storage belongs inside CCI boundary after architecture review. | VPR-PC-007 | VPR-SS-006 | CCI-SVC-006, CCI-API-006 | VPR4-OWN-006 |
| VPR4-LIN-007 | Event bus belongs inside CCI boundary after evidence review. | VPR-PC-008 | VPR-SS-007 | CCI-SVC-007, CCI-API-007 | VPR4-OWN-007 |
| VPR4-LIN-008 | Observability telemetry belongs inside CCI; dashboards remain application-owned. | VPR-PC-009, VPR-PC-028 | VPR-SS-008, VPR-SS-022 | CCI-SVC-008, CCI-SVC-022 | VPR4-OWN-008, VPR4-OWN-022 |
| VPR4-LIN-009 | Trust and isolation belong inside CCI boundary. | VPR-PC-010 | VPR-SS-009 | CCI-SVC-009, CCI-API-009 | VPR4-OWN-009 |
| VPR4-LIN-010 | Certification kernel belongs inside CCI; domain gates remain outside core. | VPR-PC-011 | VPR-SS-010, VPR-MRG-007 | CCI-SVC-010, CCI-API-010 | VPR4-OWN-010 |
| VPR4-LIN-011 | Configuration service belongs inside CCI after architecture review. | VPR-PC-012 | VPR-SS-011 | CCI-SVC-011, CCI-API-011 | VPR4-OWN-011 |
| VPR4-LIN-012 | Secrets manager belongs inside CCI after evidence review. | VPR-PC-013 | VPR-SS-012 | CCI-SVC-012, CCI-API-012 | VPR4-OWN-012 |
| VPR4-LIN-013 | Workflow engine and state transitions belong inside CCI. | VPR-PC-014, VPR-PC-025 | VPR-SS-013, VPR-MRG-005 | CCI-SVC-013, CCI-API-013 | VPR4-OWN-013 |
| VPR4-LIN-014 | Search and query service belongs inside CCI. | VPR-PC-016 | VPR-SS-014, VPR-MRG-008 | CCI-SVC-014, CCI-API-014 | VPR4-OWN-014 |
| VPR4-LIN-015 | Scheduler belongs inside CCI after architecture review. | VPR-PC-017 | VPR-SS-015 | CCI-SVC-015, CCI-API-015 | VPR4-OWN-015 |
| VPR4-LIN-016 | API gateway and registry belong inside CCI after architecture review. | VPR-PC-018 | VPR-SS-016 | CCI-SVC-016, CCI-API-016 | VPR4-OWN-016 |
| VPR4-LIN-017 | Resource management belongs inside CCI boundary. | VPR-PC-019 | VPR-SS-017 | CCI-SVC-017, CCI-API-017 | VPR4-OWN-017 |
| VPR4-LIN-018 | Dependency graph kernel belongs inside CCI; decision semantics remain outside core. | VPR-PC-020 | VPR-SS-018, VPR-MRG-009 | CCI-SVC-018, CCI-API-018 | VPR4-OWN-018 |
| VPR4-LIN-019 | Contract validation belongs inside CCI boundary. | VPR-PC-021 | VPR-SS-019 | CCI-SVC-019, CCI-API-019 | VPR4-OWN-019 |
| VPR4-LIN-020 | Lineage service belongs inside CCI boundary. | VPR-PC-022 | VPR-SS-020 | CCI-SVC-020, CCI-API-020 | VPR4-OWN-020 |
| VPR4-LIN-021 | Evidence registry belongs inside CCI; scoring overlays remain outside core. | VPR-PC-023 | VPR-SS-021, VPR-MRG-010 | CCI-SVC-021, CCI-API-021 | VPR4-OWN-021 |
| VPR4-LIN-022 | Recommendation and mission intelligence remain application-owned. | VPR-PC-029, VPR-PC-030 | VPR-SS-023, VPR-SS-024 | CCI-SVC-023, CCI-SVC-024 | VPR4-OWN-023, VPR4-OWN-024 |

## Outputs to CCI

Direct implementation inputs:

- Platform Ownership Registry
- Capability Ownership Matrix
- Infrastructure Boundary Model
- Platform Responsibility Map
- Platform Contract References
- Platform Extension Boundary Registry
- Ownership Decision Ledger
- Infrastructure Lineage Ledger

CCI implementation may begin only for services with `OWNED` status and referenced platform contracts. `UNDER_REVIEW` services require architecture or evidence review before activation.

## Exit Criteria Assessment

| Exit criterion | Status |
| --- | --- |
| Infrastructure boundaries defined | Satisfied in Infrastructure Boundary Model. |
| Platform ownership explicit | Satisfied in Platform Ownership Registry. |
| Ownership uniqueness verified | Satisfied by one owner per reusable service. |
| Reusable capabilities classified | Satisfied through classification rules and ownership matrix. |
| Platform contracts referenced | Satisfied through CCI API and application contract references. |
| Extension boundaries validated | Satisfied in Platform Extension Boundary Registry. |
| Duplicate platform ownership eliminated | Satisfied by exclusive constitutional ownership decisions. |
| Ownership lineage complete | Satisfied in Infrastructure Lineage Ledger. |
| Deterministic replay validated | Satisfied for owned services; under-review services preserve replay blockers. |
| Constitutional compliance verified | Satisfied in Boundary Validation Report. |
| Implementation-ready ownership model approved | Pending constitutional approval. |

VPR.4 is complete as an infrastructure boundary baseline. It establishes exclusive CCI ownership for reusable platform infrastructure, preserves Mission Control application ownership where appropriate, and prepares VPR.5 platform contract definition.
