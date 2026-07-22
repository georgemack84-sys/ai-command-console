# VPR.3 - Service Decomposition

Status: decomposition baseline

Predecessors:

- [VPR.1 - Platform Capability Discovery](./vpr-1-platform-capability-discovery.md)
- [VPR.2 - Shared Service Qualification](./vpr-2-shared-service-qualification.md)

Target promotion program: Civitas Core Infrastructure (CCI)

## Purpose

VPR.3 decomposes validated Mission Control capabilities into reusable, implementation-ready platform services that form the architectural foundation of CCI.

This phase transforms qualified shared services from VPR.2 into canonical service boundaries, APIs, shared infrastructure components, extension points, integration patterns, and capability allocations. Every decomposition decision preserves deterministic governance, immutable lineage, and traceability back to Mission Control evidence.

## Service Decomposition Framework

Service decomposition starts with VPR.2 `VPR-SS-*` qualification decisions and produces CCI service definitions.

Each service decomposition record includes:

- Service identity: stable `CCI-SVC-*` identifier.
- Source qualification: one or more `VPR-SS-*` records.
- Source capability lineage: originating `VPR-PC-*` records from VPR.1.
- Canonical owner: one platform owner accountable for service boundary and lifecycle.
- Responsibilities: what the service owns.
- Non-responsibilities: what the service must not own.
- APIs: canonical platform interfaces exposed by the service.
- Infrastructure component: shared implementation component that must exist exactly once.
- Extension points: governed ways ecosystem programs can extend behavior.
- Dependencies: consumed platform services.
- Allocation outcome: shared platform service, shared infrastructure component, platform extension point, or application-specific capability.
- CCI readiness: implementation-ready, implementation-ready with constraints, architecture-required, evidence-required, or retained outside CCI.

Decomposition must be deterministic: the same VPR.1 and VPR.2 inputs must produce the same service boundaries, ownership, dependencies, and allocation outcomes.

## Decomposition Rules

| Rule | Requirement |
| --- | --- |
| Unique service ownership | Every platform service has exactly one canonical owner. |
| Canonical contracts | Every service exposes version-governed contracts rather than application-specific APIs. |
| Single implementation | Shared infrastructure exists exactly once in CCI. |
| Governed extension | Extension points expose contracts only; extensions do not mutate platform internals. |
| Application consumption | Applications consume platform services and may not reimplement CCI infrastructure. |
| Immutable lineage | Every service traces to VPR.2 qualification and VPR.1 discovery evidence. |
| Replayable decisions | Service decomposition decisions preserve replay inputs, dependency rationale, and allocation outcomes. |
| Duplicate allocation prohibition | Each validated capability is allocated to one canonical destination. |
| Boundary explicitness | Each service declares responsibilities, non-responsibilities, dependencies, and prohibited imports. |
| Version governance | Every API and extension point has a compatibility and version policy. |

## Platform Service Catalog

| Service ID | CCI platform service | Source qualification | Source capabilities | Owner | CCI readiness | Allocation |
| --- | --- | --- | --- | --- | --- | --- |
| CCI-SVC-001 | Identity Service | VPR-SS-001 | VPR-PC-001 | CCI Identity Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-002 | Registry Service | VPR-SS-002 | VPR-PC-002, VPR-PC-026 | CCI Registry Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-003 | Governance Service | VPR-SS-003 | VPR-PC-003, VPR-PC-004, VPR-PC-024 | Constitutional Governance Steward | Implementation-ready | Shared Platform Service |
| CCI-SVC-004 | Replay Service | VPR-SS-004 | VPR-PC-005, VPR-PC-015 | Replay Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-005 | Audit Ledger Service | VPR-SS-005 | VPR-PC-006, VPR-PC-027 | Audit Ledger Steward | Implementation-ready | Shared Platform Service |
| CCI-SVC-006 | Evidence Storage Service | VPR-SS-006 | VPR-PC-007 | Storage Steward | Architecture-required | Shared Infrastructure Component |
| CCI-SVC-007 | Event Bus | VPR-SS-007 | VPR-PC-008 | Event Steward | Evidence-required | Shared Infrastructure Component |
| CCI-SVC-008 | Observability Service | VPR-SS-008 | VPR-PC-009, VPR-PC-028 telemetry surfaces | Observability Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-009 | Trust Boundary Service | VPR-SS-009 | VPR-PC-010 | Trust Boundary Steward | Implementation-ready | Shared Platform Service |
| CCI-SVC-010 | Certification Service | VPR-SS-010 | VPR-PC-011 | Certification Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-011 | Configuration Service | VPR-SS-011 | VPR-PC-012 | Configuration Steward | Architecture-required | Shared Platform Service |
| CCI-SVC-012 | Secrets Manager | VPR-SS-012 | VPR-PC-013 | Security Steward | Evidence-required | Shared Infrastructure Component |
| CCI-SVC-013 | Workflow Engine | VPR-SS-013 | VPR-PC-014, VPR-PC-025 | Workflow Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-014 | Search and Query Service | VPR-SS-014 | VPR-PC-016 | Query Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-015 | Scheduler | VPR-SS-015 | VPR-PC-017 | Scheduling Steward | Architecture-required | Shared Infrastructure Component |
| CCI-SVC-016 | API Gateway and Registry | VPR-SS-016 | VPR-PC-018 | API Platform Steward | Architecture-required | Shared Infrastructure Component |
| CCI-SVC-017 | Resource Manager | VPR-SS-017 | VPR-PC-019 | Resource Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-018 | Dependency Graph Service | VPR-SS-018 | VPR-PC-020 | Dependency Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-019 | Contract Validation Service | VPR-SS-019 | VPR-PC-021 | Validation Steward | Implementation-ready | Shared Platform Service |
| CCI-SVC-020 | Lineage Service | VPR-SS-020 | VPR-PC-022 | Lineage Steward | Implementation-ready | Shared Platform Service |
| CCI-SVC-021 | Evidence Registry | VPR-SS-021 | VPR-PC-023 | Evidence Steward | Implementation-ready with constraints | Shared Platform Service |
| CCI-SVC-022 | Mission Control Visibility | VPR-SS-022 | VPR-PC-028 | Mission Control Product Steward | Retained outside CCI | Application-Specific Capability |
| CCI-SVC-023 | Recommendation Intelligence | VPR-SS-023 | VPR-PC-029 | Mission Intelligence Steward | Retained outside CCI | Application-Specific Capability |
| CCI-SVC-024 | Mission Intelligence and Strategy | VPR-SS-024 | VPR-PC-030 | Mission Intelligence Steward | Retained outside CCI | Application-Specific Capability |

## Service Responsibility Matrix

| Service | Owns | Does not own | Consumes |
| --- | --- | --- | --- |
| Identity Service | Identifier generation, namespace governance, identity lineage, collision handling, tenant binding. | Mission scoring, workflow routing, authorization decisions. | Registry, audit ledger, lineage. |
| Registry Service | Service registry, metadata registry, schema registry, reference registry, compatibility status, supersession records. | Feature-specific catalogs, UI navigation, runtime business decisions. | Identity, validation, lineage, audit ledger. |
| Governance Service | Governance engine, policy evaluation, authority resolution, fail-closed decisions, governance replay inputs. | Application recommendations, UI approvals, hidden policy mutation. | Registry, validation, trust boundary, evidence registry, audit ledger, replay. |
| Replay Service | Replay framework, replay validation, replay evidence, replay profiles, deterministic output comparison. | Live execution, live source reads, dashboard rendering. | Storage, registry, lineage, audit ledger, validation. |
| Audit Ledger Service | Audit framework, immutable audit store, canonical hashing, tamper detection, audit verification. | Mutable storage, business analytics, presentation state. | Identity, lineage, storage. |
| Evidence Storage Service | Storage abstraction, object persistence, retention policy, storage governance, immutable record references. | Evidence classification, certification approval, query ranking. | Identity, audit ledger, lineage, trust boundary. |
| Event Bus | Event routing, event subscription, event persistence, event replay handoff, event contract enforcement. | Workflow decisions, scheduling policy, business event interpretation. | Registry, validation, audit ledger, replay, observability. |
| Observability Service | Metrics, inspection surfaces, operational visibility contracts, telemetry lineage. | Dashboards, product panels, recommendation summaries. | Event bus, audit ledger, registry, search. |
| Trust Boundary Service | Tenant isolation, trust zones, access boundary validation, privacy boundary enforcement. | Credential storage, policy authorship, UI visibility. | Identity, governance, audit ledger, registry. |
| Certification Service | Qualification kernel, certification kernel, validator registry, certification replay, certification evidence packaging. | Domain-specific gate criteria, product approval UX. | Evidence registry, replay, governance, validation, audit ledger. |
| Configuration Service | Configuration registry, versioning, inheritance, distribution, validation, lineage. | Secret material, runtime business state, tenant-specific custom code. | Registry, validation, governance, audit ledger, lineage. |
| Secrets Manager | Secret management, credential distribution, rotation, key references, access audit. | Plaintext exposure, application credential interpretation, policy authoring. | Trust boundary, governance, audit ledger, registry. |
| Workflow Engine | Workflow definitions, coordination, state management, approvals, compensation, workflow replay. | Operator UI, mission recommendations, hidden execution. | Governance, event bus, scheduler, replay, audit ledger, registry. |
| Search and Query Service | Search service, index management, query processing, query federation, search governance. | Intelligence ranking semantics, dashboard layout, hidden enrichment. | Registry, evidence registry, lineage, trust boundary, audit ledger. |
| Scheduler | Scheduling engine, job coordination, deterministic execution windows, schedule policy hooks. | Workload prioritization semantics, workflow decision logic, agent strategy. | Registry, governance, resource manager, audit ledger, replay. |
| API Gateway and Registry | API gateway, endpoint registry, routing, contract versioning, auth integration, request validation. | Feature handlers, application business logic, UI routing. | Identity, registry, validation, governance, observability. |
| Resource Manager | Resource allocation, capacity management, quota enforcement, resource lifecycle, allocation governance. | Mission urgency scoring, application prioritization, scheduler internals. | Governance, scheduler, observability, audit ledger. |
| Dependency Graph Service | Graph nodes, edges, blockers, cycle detection, ordering, dependency lineage. | Decision-specific scoring, UI graph visualization. | Registry, lineage, validation, audit ledger. |
| Contract Validation Service | Validator registry, validation execution, error taxonomy, compatibility checks, fail-closed validation. | Domain semantics, UI error presentation, hidden correction. | Registry, governance, audit ledger. |
| Lineage Service | Parent-child references, provenance records, transformation lineage, lineage replay. | Evidence reliability scoring, audit hash authority. | Identity, audit ledger, registry. |
| Evidence Registry | Evidence identity, classification, provenance, bindings, evidence references. | Storage backend implementation, scoring overlays, certification approval. | Identity, storage, lineage, audit ledger, trust boundary. |

## Service Dependency Graph

```text
Identity Service
  -> Registry Service
  -> Audit Ledger Service
  -> Lineage Service

Registry Service
  -> Contract Validation Service
  -> Lineage Service
  -> Audit Ledger Service

Contract Validation Service
  -> Registry Service
  -> Governance Service
  -> Audit Ledger Service

Governance Service
  -> Registry Service
  -> Trust Boundary Service
  -> Evidence Registry
  -> Contract Validation Service
  -> Replay Service
  -> Audit Ledger Service

Replay Service
  -> Evidence Storage Service
  -> Lineage Service
  -> Contract Validation Service
  -> Audit Ledger Service

Audit Ledger Service
  -> Identity Service
  -> Lineage Service

Workflow Engine
  -> Governance Service
  -> Event Bus
  -> Scheduler
  -> Replay Service
  -> Audit Ledger Service
  -> Registry Service

Event Bus
  -> Registry Service
  -> Contract Validation Service
  -> Replay Service
  -> Observability Service
  -> Audit Ledger Service

Search and Query Service
  -> Registry Service
  -> Evidence Registry
  -> Lineage Service
  -> Trust Boundary Service
  -> Audit Ledger Service

Certification Service
  -> Evidence Registry
  -> Replay Service
  -> Governance Service
  -> Contract Validation Service
  -> Audit Ledger Service

API Gateway and Registry
  -> Identity Service
  -> Registry Service
  -> Contract Validation Service
  -> Governance Service
  -> Observability Service

Resource Manager
  -> Scheduler
  -> Governance Service
  -> Observability Service
  -> Audit Ledger Service

Configuration Service
  -> Registry Service
  -> Contract Validation Service
  -> Governance Service
  -> Audit Ledger Service
  -> Lineage Service

Secrets Manager
  -> Trust Boundary Service
  -> Governance Service
  -> Audit Ledger Service
  -> Registry Service
```

## Service Composition Model

CCI composes services in five layers:

| Layer | Services | Composition rule |
| --- | --- | --- |
| Foundation | Identity, registry, validation, lineage, audit ledger | Must exist before dependent platform services. |
| Governance and trust | Governance, trust boundary, policy module, authority module | Must fail closed and remain replayable. |
| Evidence and replay | Evidence storage, evidence registry, replay, certification | Must preserve immutable evidence and deterministic reconstruction. |
| Runtime coordination | Workflow, event bus, scheduler, resource manager, configuration, secrets | Must use governed contracts and emit audit/replay evidence. |
| Access and consumption | API gateway, search/query, observability, extension points | Must expose version-governed APIs and block hidden bypasses. |

Application services consume these layers through APIs. They do not import internal implementation modules or create local platform substitutes.

## Platform API Catalog

| API ID | Service | Canonical interface | AuthN/AuthZ | Governance | Replay | Evidence | Compatibility policy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CCI-API-001 | Identity Service | `createIdentity`, `resolveIdentity`, `validateNamespace`, `recordIdentityLineage` | Tenant-bound platform principal | Namespace and collision policy | Identity derivation replay | Identity lineage record | Semantic versioned namespace contracts. |
| CCI-API-002 | Registry Service | `registerEntry`, `resolveEntry`, `supersedeEntry`, `validateCompatibility`, `listReferences` | Platform principal with registry scope | Owner and compatibility policy | Registry version replay | Registry provenance record | Append-only versions; supersession only. |
| CCI-API-003 | Governance Service | `evaluateGovernance`, `evaluatePolicy`, `resolveAuthority`, `replayGovernanceDecision` | Authorized service or operator | Constitutional fail-closed rules | Governance replay required | Governance evidence bundle | Rule package versions are immutable. |
| CCI-API-004 | Replay Service | `buildReplay`, `runReplay`, `compareReplay`, `recordReplayEvidence` | Replay-authorized principal | Replay authorization policy | Native | Replay evidence set | Replay profiles versioned by input contract. |
| CCI-API-005 | Audit Ledger Service | `appendAuditRecord`, `verifyHashChain`, `readAuditRecord`, `exportAuditEvidence` | Audit-scoped service principal | Append-only audit policy | Hash-chain replay | Audit record and hash | No destructive mutation; only supersession records. |
| CCI-API-006 | Evidence Storage Service | `putImmutableObject`, `resolveObject`, `verifyObjectHash`, `applyRetentionPolicy` | Storage-scoped service principal | Retention and access policy | Object hash replay | Storage reference | Adapter contract must preserve immutability. |
| CCI-API-007 | Event Bus | `publishEvent`, `subscribe`, `routeEvent`, `persistEvent`, `replayEventStream` | Event-scoped service principal | Event routing policy | Event stream replay | Event envelope and route evidence | Event schemas are versioned and registry-bound. |
| CCI-API-008 | Observability Service | `emitMetric`, `inspectService`, `recordTelemetry`, `queryTelemetrySurface` | Observability-scoped principal | Visibility policy | Telemetry replay via audit/event evidence | Metrics and inspection lineage | UI-independent telemetry contracts. |
| CCI-API-009 | Trust Boundary Service | `validateTenantBoundary`, `resolveTrustZone`, `enforceIsolation`, `recordBoundaryDecision` | Trust-scoped principal | Tenant isolation and privacy policy | Boundary validation replay | Trust boundary evidence | Boundary contracts fail closed. |
| CCI-API-010 | Certification Service | `registerValidator`, `runCertification`, `replayCertification`, `issueCertificationResult` | Certification-scoped principal | Certification criteria and approval policy | Certification replay native | Certification evidence package | Validator versions immutable per certification. |
| CCI-API-011 | Configuration Service | `registerConfig`, `validateConfig`, `distributeConfig`, `supersedeConfig`, `replayConfigLineage` | Config-scoped principal | Config governance policy | Config lineage replay | Config validation evidence | Config versions append-only. |
| CCI-API-012 | Secrets Manager | `registerSecretRef`, `rotateSecret`, `distributeCredential`, `auditSecretAccess` | Strongly scoped service principal | Credential and access policy | Audit replay only; secret values excluded | Secret reference and audit event | Secret material never appears in replay output. |
| CCI-API-013 | Workflow Engine | `registerWorkflow`, `startWorkflow`, `transitionState`, `compensateWorkflow`, `replayWorkflow` | Workflow-scoped principal | Workflow and approval policy | Workflow replay native | Workflow event and state evidence | Workflow definitions versioned. |
| CCI-API-014 | Search and Query Service | `registerIndex`, `runQuery`, `federateQuery`, `verifyResultLineage` | Query-scoped principal | Query authorization and result policy | Query replay through lineage | Query result lineage | Stable ordering and authorized indexes. |
| CCI-API-015 | Scheduler | `registerJob`, `scheduleJob`, `cancelSchedule`, `recordExecution`, `replaySchedule` | Scheduler-scoped principal | Schedule policy | Schedule replay native | Job execution record | Schedule policy versions immutable. |
| CCI-API-016 | API Gateway and Registry | `registerEndpoint`, `routeRequest`, `validateRequest`, `resolveService`, `applyRatePolicy` | Gateway principal plus endpoint auth | Endpoint and rate policy | Request contract replay | Endpoint evidence | Endpoint versions backwards-compatible by policy. |
| CCI-API-017 | Resource Manager | `requestAllocation`, `evaluateQuota`, `assignCapacity`, `releaseResource`, `auditAllocation` | Resource-scoped principal | Quota and allocation policy | Allocation replay via evidence | Allocation evidence | Quota policy versions immutable. |
| CCI-API-018 | Dependency Graph Service | `registerGraph`, `addDependency`, `detectCycles`, `resolveOrder`, `explainBlockers` | Graph-scoped principal | Dependency safety policy | Graph replay native | Graph lineage record | Graph schema versions immutable. |
| CCI-API-019 | Contract Validation Service | `registerValidator`, `validateSubject`, `explainValidation`, `replayValidation` | Validation-scoped principal | Fail-closed validation policy | Validation replay native | Validation result evidence | Validator ordering versioned. |
| CCI-API-020 | Lineage Service | `recordLineage`, `resolveAncestors`, `resolveDescendants`, `verifyLineage`, `replayLineage` | Lineage-scoped principal | Provenance policy | Lineage replay native | Lineage record | Lineage records append-only. |
| CCI-API-021 | Evidence Registry | `registerEvidence`, `bindEvidence`, `classifyEvidence`, `verifyEvidence`, `resolveEvidence` | Evidence-scoped principal | Evidence governance policy | Evidence replay via lineage/storage | Evidence reference | Evidence records append-only. |

## Shared Infrastructure Components

| Component ID | Component | Provided services | Consumed services | Implementation boundary | Lifecycle owner |
| --- | --- | --- | --- | --- | --- |
| CCI-INF-001 | Identity Framework | CCI-SVC-001 | Audit, lineage, registry | Deterministic ID and namespace primitives only. | CCI Identity Steward |
| CCI-INF-002 | Registry Framework | CCI-SVC-002, CCI-SVC-016 endpoint registry | Identity, validation, lineage, audit | Service, schema, metadata, and reference registration. | CCI Registry Steward |
| CCI-INF-003 | Governance and Policy Engine | CCI-SVC-003 | Registry, validation, trust, evidence, replay, audit | Governance, policy, authority, fail-closed decisions. | Constitutional Governance Steward |
| CCI-INF-004 | Replay Framework | CCI-SVC-004 | Storage, lineage, validation, audit | Deterministic reconstruction and comparison. | Replay Steward |
| CCI-INF-005 | Audit and Integrity Framework | CCI-SVC-005 | Identity, lineage | Append-only audit, hash chains, tamper detection. | Audit Ledger Steward |
| CCI-INF-006 | Evidence Storage Framework | CCI-SVC-006 | Trust, audit, lineage | Immutable object persistence and retention. | Storage Steward |
| CCI-INF-007 | Event and Messaging Framework | CCI-SVC-007 | Registry, validation, replay, observability, audit | Event envelope, routing, persistence, subscription, message replay. | Event Steward |
| CCI-INF-008 | Observability Framework | CCI-SVC-008 | Event bus, audit, registry, search | Metrics, inspections, telemetry contracts. | Observability Steward |
| CCI-INF-009 | Trust and Isolation Framework | CCI-SVC-009 | Identity, governance, audit | Tenant boundaries, trust zones, isolation enforcement. | Trust Boundary Steward |
| CCI-INF-010 | Certification Framework | CCI-SVC-010 | Evidence, replay, governance, validation, audit | Certification kernel and validator orchestration. | Certification Steward |
| CCI-INF-011 | Configuration Framework | CCI-SVC-011 | Registry, validation, governance, audit, lineage | Config registry, versioning, inheritance, distribution. | Configuration Steward |
| CCI-INF-012 | Secret Management Framework | CCI-SVC-012 | Trust, governance, audit, registry | Secret references, rotation, credential distribution, KMS integration boundary. | Security Steward |
| CCI-INF-013 | Workflow Framework | CCI-SVC-013 | Governance, event bus, scheduler, replay, audit | Workflow definitions, state transitions, compensation, approvals. | Workflow Steward |
| CCI-INF-014 | Search Infrastructure | CCI-SVC-014 | Registry, evidence, lineage, trust, audit | Index registry, query processing, federation, result lineage. | Query Steward |
| CCI-INF-015 | Scheduling Framework | CCI-SVC-015 | Registry, governance, resource manager, audit, replay | Job registry, timers, recurring schedules, deterministic execution. | Scheduling Steward |
| CCI-INF-016 | API Gateway Framework | CCI-SVC-016 | Identity, registry, validation, governance, observability | Gateway routing, endpoint registry, version management. | API Platform Steward |
| CCI-INF-017 | Resource Management Framework | CCI-SVC-017 | Scheduler, governance, observability, audit | Capacity, quotas, allocation, resource lifecycle. | Resource Steward |
| CCI-INF-018 | Dependency Graph Framework | CCI-SVC-018 | Registry, validation, lineage, audit | Graph primitives, ordering, blockers, cycle safety. | Dependency Steward |
| CCI-INF-019 | Contract Validation Framework | CCI-SVC-019 | Registry, governance, audit | Validator registry, deterministic validation, error taxonomy. | Validation Steward |
| CCI-INF-020 | Lineage Framework | CCI-SVC-020 | Identity, registry, audit | Provenance, transformations, parent-child links. | Lineage Steward |
| CCI-INF-021 | Evidence Registry Framework | CCI-SVC-021 | Identity, storage, lineage, audit, trust | Evidence references, classification, binding, provenance. | Evidence Steward |

## Platform Extension Points

| Extension ID | Extension point | Host service | Extension contract | Governance requirements | Replay requirements | Certification obligations |
| --- | --- | --- | --- | --- | --- | --- |
| CCI-EXT-001 | Policy Providers | Governance Service | `PolicyProviderContract` | Provider must be registered, owner-bound, versioned, and fail-closed. | Policy evaluation must replay with identical inputs. | Provider must pass governance certification. |
| CCI-EXT-002 | Authority Providers | Governance Service | `AuthorityProviderContract` | Authority expansion prohibited without constitutional approval. | Authority decisions replay from immutable context. | Authority validator required. |
| CCI-EXT-003 | Workflow Extensions | Workflow Engine | `WorkflowExtensionContract` | Extension may add states or guards only through registered versions. | State transitions must replay deterministically. | Workflow certification required. |
| CCI-EXT-004 | Event Processors | Event Bus | `EventProcessorContract` | Processor must declare event types, routing scope, and tenant policy. | Processor output must bind to event replay. | Event processor certification required. |
| CCI-EXT-005 | Search Providers | Search and Query Service | `SearchProviderContract` | Provider must enforce query authorization and result lineage. | Query results must replay with stable ordering. | Search provider certification required. |
| CCI-EXT-006 | Storage Providers | Evidence Storage Service | `StorageProviderContract` | Provider must preserve immutability and retention policy. | Object references and hashes must replay. | Storage provider certification required. |
| CCI-EXT-007 | Authentication Providers | API Gateway and Registry | `AuthenticationProviderContract` | Provider must be registry-bound and trust-zone aware. | Auth decisions replay as evidence, not secret material. | Authentication provider certification required. |
| CCI-EXT-008 | Authorization Providers | API Gateway and Governance Service | `AuthorizationProviderContract` | Provider cannot bypass governance or trust boundary checks. | Authorization decisions replay from immutable context. | Authorization certification required. |
| CCI-EXT-009 | Scheduler Extensions | Scheduler | `SchedulerExtensionContract` | Extension must expose deterministic schedule policy. | Schedule execution replay required. | Scheduler certification required. |
| CCI-EXT-010 | Resource Allocation Strategies | Resource Manager | `AllocationStrategyContract` | Strategy must enforce quotas and governance policy. | Allocation decisions replay from capacity evidence. | Resource certification required. |
| CCI-EXT-011 | API Extensions | API Gateway and Registry | `ApiExtensionContract` | Extension endpoint must be versioned and contract-validated. | Request and response contract replay required. | API certification required. |
| CCI-EXT-012 | Validation Providers | Contract Validation Service | `ValidationProviderContract` | Validator must be registered, ordered, and fail-closed. | Validation replay required. | Validator certification required. |
| CCI-EXT-013 | Certification Validators | Certification Service | `CertificationValidatorContract` | Validator criteria must be immutable for issued certification. | Certification replay required. | Validator self-certification required. |
| CCI-EXT-014 | Observability Providers | Observability Service | `ObservabilityProviderContract` | Provider must expose telemetry without hidden product state. | Telemetry lineage replay required. | Observability certification required. |
| CCI-EXT-015 | Configuration Providers | Configuration Service | `ConfigurationProviderContract` | Provider must version and validate distributed configuration. | Config lineage replay required. | Configuration certification required. |
| CCI-EXT-016 | Secret Backends | Secrets Manager | `SecretBackendContract` | Backend must never expose secret values through platform evidence. | Audit replay only; secret values excluded. | Security certification required. |

## Infrastructure Boundary Specifications

| Boundary | Allowed | Prohibited |
| --- | --- | --- |
| Platform to application | Platform APIs, registered extension contracts, immutable evidence references. | Direct imports from Mission Control dashboards, recommendations, mission strategy, or feature routes. |
| Application to platform | API calls, query requests, workflow submissions, evidence registration, governance checks. | Local reimplementation of registry, identity, audit, replay, policy, or validation. |
| Extension to platform | Contract-governed extension methods, versioned provider interfaces, audit-visible outputs. | Mutation of platform internals, bypassing governance, hidden state, non-replayable side effects. |
| Secrets to evidence | Secret references, access audits, rotation events. | Plaintext secrets, derived secret values, credential material in replay bundles. |
| Storage to evidence registry | Immutable object references and hash verification. | Evidence classification decisions inside storage adapters. |
| Observability to UI | Telemetry contracts and inspection results. | Dashboard layout, product summaries, recommendation wording. |
| Event bus to workflow | Event envelopes, persisted event streams, replay handles. | Workflow business decisions inside event routing. |
| Scheduler to workflow | Deterministic execution windows, job execution records. | Workflow state transitions decided by scheduler internals. |

## Platform Interface Specifications

All CCI interfaces must follow these platform requirements:

- `interface_id`: stable CCI API or extension identifier.
- `service_id`: owning `CCI-SVC-*` service.
- `version`: semantic version or explicitly governed compatibility version.
- `owner`: canonical owner from the service catalog.
- `authn`: authentication requirement.
- `authz`: authorization and trust boundary requirement.
- `governance_policy`: governing policy references.
- `input_contract`: versioned input schema.
- `output_contract`: versioned output schema.
- `error_taxonomy`: deterministic error identifiers.
- `evidence_refs`: audit, lineage, replay, or certification evidence produced.
- `replay_policy`: replayability requirement and prohibited live reads.
- `extension_policy`: whether and how ecosystem extensions are allowed.
- `compatibility_policy`: allowed changes, deprecations, and supersession rules.

## Service Integration Patterns

| Pattern | Applies to | Rule |
| --- | --- | --- |
| Registry-first lookup | All platform service discovery | Services resolve dependencies through Registry Service, not hard-coded application references. |
| Governance-before-action | Workflow, scheduler, resource, API, configuration, secrets | Governed operations evaluate policy and authority before state change. |
| Audit-after-decision | All services | Every accepted, rejected, or fail-closed decision emits audit evidence. |
| Replay-by-reference | Replay, certification, workflow, event bus, search | Replay uses immutable references, not live source reads. |
| Lineage-on-derivation | Evidence, registry, workflow, search, certification | Derived outputs must record parent references and transformation metadata. |
| Extension-by-contract | All extension points | Extensions register contracts and versions before use. |
| Split-kernel-domain | Certification, observability, evidence, graph | Reusable kernel enters CCI; domain-specific overlays remain outside core. |
| Fail-closed validation | API, governance, validation, trust, secrets | Missing owner, schema, authority, tenant, replay, or evidence blocks the operation. |

## Capability Allocation Registry

| Allocation ID | Source capability | Qualified service | Destination | Canonical CCI service | Duplicate allocation status |
| --- | --- | --- | --- | --- | --- |
| VPR3-ALLOC-001 | VPR-PC-001 | VPR-SS-001 | Shared Platform Service | CCI-SVC-001 | Unique |
| VPR3-ALLOC-002 | VPR-PC-002, VPR-PC-026 | VPR-SS-002 | Shared Platform Service | CCI-SVC-002 | Merged by VPR-MRG-001 |
| VPR3-ALLOC-003 | VPR-PC-003, VPR-PC-004, VPR-PC-024 | VPR-SS-003 | Shared Platform Service | CCI-SVC-003 | Merged by VPR-MRG-002 |
| VPR3-ALLOC-004 | VPR-PC-005, VPR-PC-015 | VPR-SS-004 | Shared Platform Service | CCI-SVC-004 | Merged by VPR-MRG-003 |
| VPR3-ALLOC-005 | VPR-PC-006, VPR-PC-027 | VPR-SS-005 | Shared Platform Service | CCI-SVC-005 | Merged by VPR-MRG-004 |
| VPR3-ALLOC-006 | VPR-PC-007 | VPR-SS-006 | Shared Infrastructure Component | CCI-SVC-006 | Unique |
| VPR3-ALLOC-007 | VPR-PC-008 | VPR-SS-007 | Shared Infrastructure Component | CCI-SVC-007 | Unique |
| VPR3-ALLOC-008 | VPR-PC-009 | VPR-SS-008 | Shared Platform Service | CCI-SVC-008 | Split from VPR-PC-028 telemetry surfaces |
| VPR3-ALLOC-009 | VPR-PC-010 | VPR-SS-009 | Shared Platform Service | CCI-SVC-009 | Unique |
| VPR3-ALLOC-010 | VPR-PC-011 | VPR-SS-010 | Shared Platform Service | CCI-SVC-010 | Split kernel/domain gates |
| VPR3-ALLOC-011 | VPR-PC-012 | VPR-SS-011 | Shared Platform Service | CCI-SVC-011 | Unique |
| VPR3-ALLOC-012 | VPR-PC-013 | VPR-SS-012 | Shared Infrastructure Component | CCI-SVC-012 | Unique |
| VPR3-ALLOC-013 | VPR-PC-014, VPR-PC-025 | VPR-SS-013 | Shared Platform Service | CCI-SVC-013 | Merged by VPR-MRG-005 |
| VPR3-ALLOC-014 | VPR-PC-016 | VPR-SS-014 | Shared Platform Service | CCI-SVC-014 | Normalized search families |
| VPR3-ALLOC-015 | VPR-PC-017 | VPR-SS-015 | Shared Infrastructure Component | CCI-SVC-015 | Unique |
| VPR3-ALLOC-016 | VPR-PC-018 | VPR-SS-016 | Shared Infrastructure Component | CCI-SVC-016 | Split registry/gateway from feature routes |
| VPR3-ALLOC-017 | VPR-PC-019 | VPR-SS-017 | Shared Platform Service | CCI-SVC-017 | Unique |
| VPR3-ALLOC-018 | VPR-PC-020 | VPR-SS-018 | Shared Platform Service | CCI-SVC-018 | Split graph kernel from decision graph semantics |
| VPR3-ALLOC-019 | VPR-PC-021 | VPR-SS-019 | Shared Platform Service | CCI-SVC-019 | Unique |
| VPR3-ALLOC-020 | VPR-PC-022 | VPR-SS-020 | Shared Platform Service | CCI-SVC-020 | Unique |
| VPR3-ALLOC-021 | VPR-PC-023 | VPR-SS-021 | Shared Platform Service | CCI-SVC-021 | Split registry from scoring overlays |
| VPR3-ALLOC-022 | VPR-PC-028 | VPR-SS-022 | Application-Specific Capability | CCI-SVC-022 | Retained outside CCI |
| VPR3-ALLOC-023 | VPR-PC-029 | VPR-SS-023 | Application-Specific Capability | CCI-SVC-023 | Retained outside CCI |
| VPR3-ALLOC-024 | VPR-PC-030 | VPR-SS-024 | Application-Specific Capability | CCI-SVC-024 | Retained outside CCI |

## Service Qualification Ledger

| Ledger ID | Service | Decomposition decision | Lineage | Replay status | Governance status | CCI status |
| --- | --- | --- | --- | --- | --- | --- |
| VPR3-SQL-001 | Identity Service | Decompose into identity framework, namespace API, and identity lineage interface. | VPR-SS-001, VPR-PC-001 | Replayable after generic identity extraction. | Compatible. | Ready with constraints. |
| VPR3-SQL-002 | Registry Service | Decompose into registry framework, metadata registry, reference registry, and schema registry. | VPR-SS-002, VPR-PC-002, VPR-PC-026, VPR-MRG-001 | Replayable through version records. | Compatible. | Ready with consolidation. |
| VPR3-SQL-003 | Governance Service | Decompose into governance engine, policy evaluation, authority resolution, and governance replay. | VPR-SS-003, VPR-PC-003, VPR-PC-004, VPR-PC-024, VPR-MRG-002 | Replayable. | Native. | Ready. |
| VPR3-SQL-004 | Replay Service | Decompose into replay framework, replay validation, replay evidence, and deferred event replay profile. | VPR-SS-004, VPR-PC-005, VPR-PC-015, VPR-MRG-003 | Native. | Compatible. | Ready with event constraint. |
| VPR3-SQL-005 | Audit Ledger Service | Decompose into audit framework, immutable audit store, integrity verification, and tamper detection. | VPR-SS-005, VPR-PC-006, VPR-PC-027, VPR-MRG-004 | Native. | Compatible. | Ready. |
| VPR3-SQL-006 | Evidence Storage Service | Decompose into storage abstraction, object management, persistence adapter, and storage governance. | VPR-SS-006, VPR-PC-007 | Requires storage adapter replay proof. | Compatible after architecture review. | Architecture-required. |
| VPR3-SQL-007 | Event Bus | Decompose into event bus, routing, subscription, persistence, and event replay handoff. | VPR-SS-007, VPR-PC-008 | Requires event replay contract. | Compatible after event policy. | Evidence-required. |
| VPR3-SQL-008 | Observability Service | Decompose into telemetry contracts, inspection APIs, metrics, and provider extension points. | VPR-SS-008, VPR-PC-009 | Replayable through audit and events. | Compatible. | Ready with UI split. |
| VPR3-SQL-009 | Trust Boundary Service | Decompose into trust zone management, tenant isolation validation, access boundary enforcement. | VPR-SS-009, VPR-PC-010 | Replayable. | Native. | Ready. |
| VPR3-SQL-010 | Certification Service | Decompose into certification kernel, validator registry, certification replay, and evidence packaging. | VPR-SS-010, VPR-PC-011 | Native. | Native. | Ready with domain split. |
| VPR3-SQL-011 | Configuration Service | Decompose into configuration registry, distribution, versioning, validation, and lineage. | VPR-SS-011, VPR-PC-012 | Requires config lineage. | Compatible after policy binding. | Architecture-required. |
| VPR3-SQL-012 | Secrets Manager | Decompose into secret references, credential distribution, rotation, access governance, and audit. | VPR-SS-012, VPR-PC-013 | Audit replay only. | Compatible after security governance. | Evidence-required. |
| VPR3-SQL-013 | Workflow Engine | Decompose into workflow engine, workflow coordination, state management, compensation, and replay. | VPR-SS-013, VPR-PC-014, VPR-PC-025, VPR-MRG-005 | Native. | Compatible. | Ready with operator action decoupling. |
| VPR3-SQL-014 | Search and Query Service | Decompose into search service, index management, query processing, federation, and governance. | VPR-SS-014, VPR-PC-016, VPR-MRG-008 | Replayable through lineage. | Compatible. | Ready with query normalization. |
| VPR3-SQL-015 | Scheduler | Decompose into scheduling engine, resource scheduling, job coordination, deterministic execution. | VPR-SS-015, VPR-PC-017 | Requires job replay contract. | Compatible after policy binding. | Architecture-required. |
| VPR3-SQL-016 | API Gateway and Registry | Decompose into gateway, contract registry, version management, request routing, auth integration. | VPR-SS-016, VPR-PC-018 | Contract replay available; request replay pending. | Compatible. | Architecture-required. |
| VPR3-SQL-017 | Resource Manager | Decompose into allocation, capacity management, quota enforcement, and lifecycle. | VPR-SS-017, VPR-PC-019 | Replayable after allocation evidence contract. | Compatible. | Ready with vocabulary normalization. |
| VPR3-SQL-018 | Dependency Graph Service | Decompose into graph primitives, ordering, blockers, cycle detection, and lineage. | VPR-SS-018, VPR-PC-020, VPR-MRG-009 | Native. | Compatible. | Ready with graph kernel split. |
| VPR3-SQL-019 | Contract Validation Service | Decompose into validator registry, validation execution, error taxonomy, and validation replay. | VPR-SS-019, VPR-PC-021 | Native. | Compatible. | Ready. |
| VPR3-SQL-020 | Lineage Service | Decompose into provenance, parent-child references, transformation records, and lineage replay. | VPR-SS-020, VPR-PC-022 | Native. | Compatible. | Ready. |
| VPR3-SQL-021 | Evidence Registry | Decompose into evidence identity, classification, provenance, binding, and verification. | VPR-SS-021, VPR-PC-023, VPR-MRG-010 | Native. | Compatible. | Ready with scoring split. |
| VPR3-SQL-022 | Mission Control Visibility | Retain as application-specific consumer of observability, query, governance, replay, and audit. | VPR-SS-022, VPR-PC-028 | Consumes platform replay. | Consumes platform governance. | Outside CCI. |
| VPR3-SQL-023 | Recommendation Intelligence | Retain as application-specific consumer of platform services. | VPR-SS-023, VPR-PC-029 | Consumes platform replay. | Consumes platform governance. | Outside CCI. |
| VPR3-SQL-024 | Mission Intelligence and Strategy | Retain as application-specific consumer of platform services. | VPR-SS-024, VPR-PC-030 | Consumes platform replay. | Consumes platform governance. | Outside CCI. |

## Outputs to CCI

The following artifacts in this document are direct implementation inputs into CCI:

- Platform Service Catalog
- Service Responsibility Matrix
- Service Dependency Graph
- Service Composition Model
- Platform API Catalog
- Shared Infrastructure Components
- Platform Extension Points
- Infrastructure Boundary Specifications
- Platform Interface Specifications
- Service Integration Patterns
- Capability Allocation Registry
- Service Qualification Ledger

Implementation must begin with foundation-layer services marked implementation-ready, then proceed through governance/trust, evidence/replay, runtime coordination, and access/consumption layers.

## Constitutional Validation Ledger

| Validation ID | Rule | Result | Notes |
| --- | --- | --- | --- |
| VPR3-VAL-001 | Every platform capability decomposes into deterministic service model. | Pass | Each VPR.2 service maps to a `CCI-SVC-*` record. |
| VPR3-VAL-002 | Platform services have unique ownership. | Pass | Each service has one owner in the catalog. |
| VPR3-VAL-003 | Service contracts are canonical. | Pass | Platform API catalog and interface specs define canonical contracts. |
| VPR3-VAL-004 | APIs are version governed. | Pass | API catalog includes compatibility policy for each API. |
| VPR3-VAL-005 | Shared infrastructure exists only once. | Pass | Shared infrastructure components are single canonical components. |
| VPR3-VAL-006 | Extension points expose only governed contracts. | Pass | Extension point catalog defines governance, replay, and certification requirements. |
| VPR3-VAL-007 | Applications consume platform services rather than reimplementing them. | Pass | Application capabilities are retained outside CCI as consumers. |
| VPR3-VAL-008 | Every decomposition decision preserves immutable lineage. | Pass | All services trace to VPR.2 and VPR.1 IDs. |
| VPR3-VAL-009 | Every decomposition decision is replayable. | Conditional pass | Ready services are replayable; evidence-required services list blockers. |
| VPR3-VAL-010 | Service allocation is deterministic. | Pass | Capability allocation registry assigns each source to one destination. |
| VPR3-VAL-011 | Duplicate platform implementations are prohibited. | Pass | Merge and split decisions preserve one canonical CCI service per capability family. |

## Exit Criteria Assessment

| Exit criterion | Status |
| --- | --- |
| Service decomposition complete | Satisfied for all VPR.2 qualified services. |
| Platform services defined | Satisfied in Platform Service Catalog. |
| Platform API Catalog complete | Satisfied in API catalog for all CCI services. |
| Shared Infrastructure Components identified | Satisfied in Shared Infrastructure Components. |
| Platform Extension Points governed | Satisfied in Extension Points catalog. |
| Service ownership deterministic | Satisfied through one owner per service. |
| Infrastructure boundaries validated | Satisfied through boundary specifications. |
| Service contracts complete | Satisfied as implementation-ready contract definitions; blocked services list architecture gaps. |
| Duplicate implementations eliminated | Satisfied at architecture level through allocation and merge records. |
| Implementation inputs prepared for CCI | Satisfied in Outputs to CCI. |
| Lineage preserved | Satisfied through VPR.1 and VPR.2 references. |
| Replay reproducible | Satisfied for ready services; conditional blockers recorded for architecture-required services. |
| Platform architecture implementation-ready | Satisfied for foundation services and constrained for services requiring architecture or evidence review. |

VPR.3 is complete as a service decomposition baseline. CCI implementation should begin with foundation-layer services marked implementation-ready, while architecture-required and evidence-required services must resolve the listed service contract, replay, governance, or persistence gaps before implementation.
