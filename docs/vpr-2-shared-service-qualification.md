# VPR.2 - Shared Service Qualification

Status: qualification baseline

Predecessor: [VPR.1 - Platform Capability Discovery](./vpr-1-platform-capability-discovery.md)

Target promotion program: Civitas Core Infrastructure (CCI)

## Purpose

VPR.2 qualifies discovered Mission Control platform capabilities for promotion into CCI as governed shared services. It determines whether each discovered capability is reusable platform infrastructure, a program service, an application service, a tenant service, or an experimental service.

This artifact preserves complete lineage from VPR.1 discovery records through qualification decisions. It normalizes overlapping implementations into canonical services, records merge and supersession history, establishes canonical ownership, and creates an implementation-ready CCI backlog.

## Qualification Framework

Qualification starts from the VPR.1 `VPR-PC-*` capability records and produces `VPR-SS-*` shared service decisions.

Each qualification record includes:

- Qualification identity: stable `VPR-SS-*` identifier.
- Source capability references: one or more VPR.1 `VPR-PC-*` records.
- Qualification category: shared platform service, program service, application service, tenant service, or experimental service.
- Decision outcome: one of the constitutional qualification outcomes.
- Canonical owner: one accountable platform owner.
- Normalization decision: retained, merged, superseded, split, or deferred.
- Contract reference: shared service contract required for CCI implementation.
- Dependency posture: stable, needs consolidation, blocked, or retained outside CCI.
- Evidence references: VPR.1 evidence IDs and additional qualification evidence.
- CCI backlog action: implement, extract, consolidate, define contract, reject, or retain.

## Qualification Categories

| Category | Rule | CCI posture |
| --- | --- | --- |
| Shared Platform Service | Reusable by multiple Civitas programs and independent of Mission Control application semantics. | Eligible for CCI backlog. |
| Program Service | Reusable within one Civitas program or phase family but not generic enough for CCI core. | Keep in program shared layer. |
| Application Service | Specific to Mission Control product workflows or application behavior. | Retain outside CCI. |
| Tenant Service | Specific to one tenant implementation or deployment context. | Retain outside CCI unless generalized later. |
| Experimental Service | Reusable pattern exists but evidence, contracts, dependency stability, or maturity is insufficient. | Conditionally qualify or require more evidence. |

## Qualification Rules

Every capability is scored against twelve criteria:

| Criterion | Qualification test |
| --- | --- |
| Functional reuse | Capability can serve multiple Civitas programs without Mission Control-specific semantics. |
| Architectural independence | Service boundary can be implemented without importing product-specific routes, dashboards, or intelligence engines. |
| Implementation maturity | Existing implementation is complete enough to inform CCI design. |
| Deterministic behavior | Inputs, outputs, validation, replay, or ordering are reproducible. |
| Governance compatibility | Service supports constitutional governance and fail-closed behavior. |
| Certification compatibility | Service can produce evidence for certification gates. |
| Replay compatibility | Service can be replayed from immutable inputs or emit replayable evidence. |
| Security isolation | Tenant, authority, trust, and credential boundaries are explicit. |
| Scalability | Service can support multiple programs, tenants, and workloads. |
| Ecosystem applicability | Service is useful beyond a single Mission Control feature family. |
| Ownership clarity | One canonical owner is assigned. |
| Dependency stability | Dependencies are platform-level, normalized, and non-circular. |

Decision outcomes:

- `QUALIFIED_SHARED_SERVICE`
- `QUALIFIED_PROGRAM_SERVICE`
- `QUALIFIED_APPLICATION_SERVICE`
- `QUALIFIED_TENANT_SERVICE`
- `CONDITIONALLY_QUALIFIED`
- `REQUIRES_MORE_EVIDENCE`
- `REQUIRES_ARCHITECTURE_REVIEW`
- `REJECTED`

## Qualification Process

```text
VPR.1 Capability Discovery
  -> Capability Classification
  -> Platform Suitability Review
  -> Dependency Analysis
  -> Capability Normalization
  -> Merge Evaluation
  -> Qualification Decision
  -> Shared Service Promotion
  -> CCI Backlog
```

No capability may enter the CCI backlog without a qualification decision, canonical owner, immutable source lineage, reusable contract, and dependency posture.

## Qualified Shared Service Catalog

| ID | Canonical shared service | Source capabilities | Category | Decision outcome | Owner | Normalization | Contract | CCI backlog action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR-SS-001 | Identity Service | VPR-PC-001 | Shared Platform Service | `CONDITIONALLY_QUALIFIED` | CCI Identity Steward | Retain source; extract generic identity core from autonomy identity. | Identity Service Contract | Extract and generalize. |
| VPR-SS-002 | Registry Service | VPR-PC-002, VPR-PC-026 | Shared Platform Service | `CONDITIONALLY_QUALIFIED` | CCI Registry Steward | Merge registry foundation and contract/schema registry. | Registry Service Contract | Consolidate first. |
| VPR-SS-003 | Governance Service | VPR-PC-003, VPR-PC-004, VPR-PC-024 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Constitutional Governance Steward | Merge governance, policy evaluation, and authority boundary under separate modules. | Governance Service Contract | Implement CCI core. |
| VPR-SS-004 | Replay Service | VPR-PC-005, VPR-PC-015 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Replay Steward | Merge replay engine and event replay as replay profiles. | Replay Service Contract | Implement deterministic replay core; defer event profile until event bus exists. |
| VPR-SS-005 | Audit Ledger Service | VPR-PC-006, VPR-PC-027 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Audit Ledger Steward | Merge audit, ledger, integrity, hashing, and tamper detection primitives. | Audit Ledger Contract | Implement CCI core. |
| VPR-SS-006 | Evidence Storage Service | VPR-PC-007 | Experimental Service | `REQUIRES_ARCHITECTURE_REVIEW` | Storage Steward | Retain; storage backend independence not proven. | Evidence Storage Contract | Define architecture and persistence adapter boundary. |
| VPR-SS-007 | Event Bus | VPR-PC-008 | Experimental Service | `REQUIRES_MORE_EVIDENCE` | Event Steward | Retain implied eventing; explicit event bus absent. | Event Bus Contract | Define event registry, routing, subscription, and persistence contracts. |
| VPR-SS-008 | Observability Service | VPR-PC-009 | Shared Platform Service | `CONDITIONALLY_QUALIFIED` | Observability Steward | Split telemetry contract from dashboard presentation. | Observability Contract | Extract telemetry and inspection surfaces. |
| VPR-SS-009 | Trust Boundary Service | VPR-PC-010 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Trust Boundary Steward | Retain and promote trust, isolation, and tenant boundary primitives. | Trust Boundary Contract | Implement CCI core. |
| VPR-SS-010 | Certification Service | VPR-PC-011 | Program Service | `CONDITIONALLY_QUALIFIED` | Certification Steward | Split common certification kernel from domain-specific certification gates. | Certification Kernel Contract | Promote kernel; retain domain gates. |
| VPR-SS-011 | Configuration Service | VPR-PC-012 | Experimental Service | `REQUIRES_ARCHITECTURE_REVIEW` | Configuration Steward | Retain config evidence; canonical registry missing. | Configuration Service Contract | Define registry, versioning, inheritance, distribution, and lineage. |
| VPR-SS-012 | Secrets Manager | VPR-PC-013 | Experimental Service | `REQUIRES_MORE_EVIDENCE` | Security Steward | Retain credential-scope evidence; secrets manager absent. | Secrets Manager Contract | Define storage, rotation, KMS, audit, and secure distribution. |
| VPR-SS-013 | Workflow Engine | VPR-PC-014, VPR-PC-025 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Workflow Steward | Merge workflow orchestration and state transition framework. | Workflow Engine Contract | Implement CCI workflow core after operator action decoupling. |
| VPR-SS-014 | Search and Query Service | VPR-PC-016 | Shared Platform Service | `CONDITIONALLY_QUALIFIED` | Query Steward | Normalize governance search, autonomy search, and retrieval query contracts. | Search and Query Contract | Consolidate query authorization and result lineage. |
| VPR-SS-015 | Scheduler | VPR-PC-017 | Experimental Service | `REQUIRES_ARCHITECTURE_REVIEW` | Scheduling Steward | Retain job evidence; agent data files are not canonical service state. | Scheduler Contract | Extract job registry and schedule policy engine. |
| VPR-SS-016 | API Gateway and Registry | VPR-PC-018 | Experimental Service | `CONDITIONALLY_QUALIFIED` | API Platform Steward | Split endpoint registry and request validation from route handlers. | API Infrastructure Contract | Define gateway implementation and service discovery. |
| VPR-SS-017 | Resource Manager | VPR-PC-019 | Experimental Service | `CONDITIONALLY_QUALIFIED` | Resource Steward | Retain resource scheduling and workload distribution; normalize quota vocabulary. | Resource Management Contract | Consolidate capacity and allocation rules. |
| VPR-SS-018 | Dependency Graph Service | VPR-PC-020 | Shared Platform Service | `CONDITIONALLY_QUALIFIED` | Dependency Steward | Extract generic graph kernel from decision graph implementations. | Dependency Graph Contract | Decouple decision-specific graph types. |
| VPR-SS-019 | Contract Validation Service | VPR-PC-021 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Validation Steward | Retain validation core as canonical shared service. | Contract Validation Contract | Implement CCI core. |
| VPR-SS-020 | Lineage Service | VPR-PC-022 | Shared Platform Service | `QUALIFIED_SHARED_SERVICE` | Lineage Steward | Merge lineage and provenance services under canonical lineage model. | Lineage Service Contract | Implement CCI core. |
| VPR-SS-021 | Evidence Registry | VPR-PC-023 | Program Service | `CONDITIONALLY_QUALIFIED` | Evidence Steward | Promote evidence registry as shared domain service; retain reliability scoring separately. | Evidence Registry Contract | Promote to shared domain backlog. |
| VPR-SS-022 | Mission Control Visibility | VPR-PC-028 | Application Service | `QUALIFIED_APPLICATION_SERVICE` | Mission Control Product Steward | Retain outside CCI; extract only observability data contracts to VPR-SS-008. | Application View Contract | Do not promote. |
| VPR-SS-023 | Recommendation Intelligence | VPR-PC-029 | Application Service | `QUALIFIED_APPLICATION_SERVICE` | Mission Intelligence Steward | Retain outside CCI; consumes governance, replay, audit, evidence, and observability. | Recommendation Application Contract | Do not promote. |
| VPR-SS-024 | Mission Intelligence and Strategy | VPR-PC-030 | Application Service | `QUALIFIED_APPLICATION_SERVICE` | Mission Intelligence Steward | Retain outside CCI; consumes platform services. | Mission Intelligence Application Contract | Do not promote. |

## Capability Normalization Engine

Normalization rules:

- Equivalent capabilities normalize to one canonical shared service.
- Overlapping capabilities are merged only when their reusable contract, owner, and dependency boundary are compatible.
- Partially overlapping capabilities are split into platform kernel plus retained domain-specific implementation.
- Obsolete or duplicated capabilities are superseded but never removed from lineage.
- Application capabilities may contribute contracts or telemetry surfaces, but their product behavior is retained outside CCI.
- A merge is valid only when source evidence, merge rationale, effective version, owner, and immutable timestamp are recorded.

Normalization outcomes:

| Outcome | Meaning |
| --- | --- |
| Retained | Capability remains independently traceable and may be promoted as-is or retained outside CCI. |
| Merged | Multiple capabilities normalize into one canonical service. |
| Superseded | A source capability is replaced for future CCI implementation but remains historically referenced. |
| Split | Platform kernel is extracted while application or domain behavior remains outside CCI. |
| Deferred | Qualification cannot proceed until more evidence or architecture review is complete. |

## Capability Merge Registry

| Merge ID | Canonical service | Merged or superseded capabilities | Decision | Rationale | Originating evidence | Effective version | Decision authority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VPR-MRG-001 | Registry Service | VPR-PC-002, VPR-PC-026 | Merge | Registry foundation and contract/schema registry are equivalent infrastructure families with shared provenance and versioning concerns. | VPR-EV-003, VPR-EV-017 | `vpr-2.0` | CCI Registry Steward |
| VPR-MRG-002 | Governance Service | VPR-PC-003, VPR-PC-004, VPR-PC-024 | Merge with modules | Governance, policy evaluation, and authority boundaries are separable modules of one constitutional governance service family. | VPR-EV-004, VPR-EV-019 | `vpr-2.0` | Constitutional Governance Steward |
| VPR-MRG-003 | Replay Service | VPR-PC-005, VPR-PC-015 | Merge with deferred event profile | Event replay belongs under replay but cannot be complete until event bus contracts exist. | VPR-EV-005, VPR-EV-006, VPR-EV-010 | `vpr-2.0` | Replay Steward |
| VPR-MRG-004 | Audit Ledger Service | VPR-PC-006, VPR-PC-027 | Merge | Audit, append-only ledgers, hashing, integrity, and tamper detection form one immutable evidence service family. | VPR-EV-007, VPR-EV-008 | `vpr-2.0` | Audit Ledger Steward |
| VPR-MRG-005 | Workflow Engine | VPR-PC-014, VPR-PC-025 | Merge | Workflow orchestration and state transitions share lifecycle guards, approvals, audit, compensation, and replay. | VPR-EV-009 | `vpr-2.0` | Workflow Steward |
| VPR-MRG-006 | Observability Service | VPR-PC-009, VPR-PC-028 telemetry surfaces | Split | Dashboard UI remains application-specific; telemetry and inspection contracts normalize into observability. | VPR-EV-013, VPR-EV-022 | `vpr-2.0` | Observability Steward |
| VPR-MRG-007 | Certification Service | VPR-PC-011 | Split | Certification kernel is reusable; domain-specific certification gates remain program services. | VPR-EV-016, VPR-EV-018 | `vpr-2.0` | Certification Steward |
| VPR-MRG-008 | Search and Query Service | Governance search, autonomy search, retrieval query implementations under VPR-PC-016 | Merge | Search implementations share authorization, index, lineage, and query contract concerns. | VPR-EV-011 | `vpr-2.0` | Query Steward |
| VPR-MRG-009 | Dependency Graph Service | Decision graph and approval/dependency graph implementations under VPR-PC-020 | Split | Generic graph primitives qualify; decision-specific graph semantics remain consumers. | VPR-EV-015 | `vpr-2.0` | Dependency Steward |
| VPR-MRG-010 | Evidence Registry | VPR-PC-023 | Split | Evidence identity, provenance, and binding qualify; reliability scoring and poisoning defense remain domain overlays unless generalized. | VPR-EV-018 | `vpr-2.0` | Evidence Steward |

All merge records preserve source capability references permanently. Superseded references remain valid for historical replay, audit, and certification.

## Platform Ownership Registry

| Canonical owner | Qualified services | Ownership decision |
| --- | --- | --- |
| CCI Identity Steward | VPR-SS-001 | Owns namespace, identity generation, collision, and tenant binding rules. |
| CCI Registry Steward | VPR-SS-002 | Owns canonical registry, contract registry, schema registry, provenance, and versioning. |
| Constitutional Governance Steward | VPR-SS-003 | Owns governance doctrine, policy evaluation interfaces, authority outcomes, and fail-closed rules. |
| Replay Steward | VPR-SS-004 | Owns deterministic replay and event replay profile requirements. |
| Audit Ledger Steward | VPR-SS-005 | Owns append-only records, hash chains, integrity, and tamper evidence. |
| Storage Steward | VPR-SS-006 | Owns immutable evidence storage architecture once reviewed. |
| Event Steward | VPR-SS-007 | Owns event envelope, event registry, routing, subscriptions, and event persistence. |
| Observability Steward | VPR-SS-008 | Owns telemetry, inspection, metrics, and operational visibility contracts. |
| Trust Boundary Steward | VPR-SS-009 | Owns tenant isolation, trust zones, privacy boundaries, and access validation. |
| Certification Steward | VPR-SS-010 | Owns common certification kernel and certification evidence model. |
| Configuration Steward | VPR-SS-011 | Owns configuration registry, validation, inheritance, versioning, and distribution. |
| Security Steward | VPR-SS-012 | Owns secrets lifecycle, credential scopes, key management, rotation, and audit. |
| Workflow Steward | VPR-SS-013 | Owns orchestration, lifecycle transitions, compensation, approvals, and workflow replay. |
| Query Steward | VPR-SS-014 | Owns query contracts, index registry, query federation, authorization, and result lineage. |
| Scheduling Steward | VPR-SS-015 | Owns job registry, timers, recurrence, delayed execution, and schedule policy. |
| API Platform Steward | VPR-SS-016 | Owns API gateway, endpoint registry, routing, validation, auth integration, and service discovery. |
| Resource Steward | VPR-SS-017 | Owns quotas, capacity, workload assignment, and allocation governance. |
| Dependency Steward | VPR-SS-018 | Owns graph primitives, dependency ordering, cycle detection, blocker analysis, and merge safety. |
| Validation Steward | VPR-SS-019 | Owns validation core, deterministic validator execution, and fail-closed validation results. |
| Lineage Steward | VPR-SS-020 | Owns lineage records, provenance, parent-child binding, and lineage replay. |
| Evidence Steward | VPR-SS-021 | Owns evidence identity, references, provenance, and evidence binding. |
| Mission Control Product Steward | VPR-SS-022 | Owns Mission Control-specific UI and visibility experiences. |
| Mission Intelligence Steward | VPR-SS-023, VPR-SS-024 | Owns Mission Control recommendation, mission intelligence, and strategy behavior. |

## Shared Service Contract Library

| Contract | Applies to | Required fields | Compatibility requirements |
| --- | --- | --- | --- |
| Identity Service Contract | VPR-SS-001 | `identity_id`, `namespace`, `subject_ref`, `tenant_id`, `schema_version`, `collision_policy`, `created_at`, `integrity_hash` | Deterministic ID generation, tenant binding, namespace versioning. |
| Registry Service Contract | VPR-SS-002 | `registry_id`, `entry_type`, `owner`, `version`, `status`, `schema_ref`, `provenance_ref`, `supersedes`, `hash` | Append-only version history and compatibility validation. |
| Governance Service Contract | VPR-SS-003 | `governance_request_id`, `subject`, `policy_refs`, `authority_context`, `decision`, `violations`, `evidence_refs`, `fail_closed` | Deterministic rule ordering and constitutional fail-closed behavior. |
| Replay Service Contract | VPR-SS-004 | `replay_id`, `input_refs`, `schema_versions`, `expected_hashes`, `runtime_constraints`, `output_refs`, `drift_result` | No live reads during replay; all inputs immutable and lineage-bound. |
| Audit Ledger Contract | VPR-SS-005 | `audit_id`, `actor`, `action`, `subject_ref`, `timestamp`, `evidence_refs`, `previous_hash`, `record_hash` | Append-only, hash-linked, tamper-detectable. |
| Evidence Storage Contract | VPR-SS-006 | `storage_record_id`, `tenant_id`, `evidence_ref`, `storage_class`, `retention_policy`, `immutability_policy`, `hash` | Storage adapter must preserve immutability and replay references. |
| Event Bus Contract | VPR-SS-007 | `event_id`, `event_type`, `source`, `tenant_id`, `payload_schema`, `sequence`, `causality_refs`, `routing_policy`, `hash` | Ordering, persistence, routing, and subscription semantics must be deterministic. |
| Observability Contract | VPR-SS-008 | `surface_id`, `metric_refs`, `inspection_refs`, `tenant_scope`, `visibility_policy`, `source_lineage`, `timestamp` | UI-independent telemetry and audit-visible inspection. |
| Trust Boundary Contract | VPR-SS-009 | `boundary_id`, `tenant_id`, `trust_zone`, `subject`, `operation`, `validation_result`, `violations`, `evidence_refs` | Tenant isolation and trust validation must fail closed. |
| Certification Kernel Contract | VPR-SS-010 | `certification_id`, `subject_ref`, `criteria`, `evidence_refs`, `replay_result`, `governance_result`, `approval`, `hash` | Domain gates must plug into a common replay-backed certification kernel. |
| Configuration Service Contract | VPR-SS-011 | `config_id`, `scope`, `version`, `value_ref`, `validation_result`, `inherits_from`, `distributed_to`, `lineage_ref` | Config mutation must be versioned, validated, lineage-bound, and replayable. |
| Secrets Manager Contract | VPR-SS-012 | `secret_ref`, `scope`, `credential_type`, `rotation_policy`, `kms_ref`, `distribution_policy`, `audit_ref` | Secret material is never exposed through qualification evidence. |
| Workflow Engine Contract | VPR-SS-013 | `workflow_id`, `states`, `transitions`, `guards`, `approvals`, `compensations`, `events`, `replay_refs` | State transitions must be deterministic, auditable, and replayable. |
| Search and Query Contract | VPR-SS-014 | `query_id`, `requester`, `authorization`, `indexes`, `filters`, `federation_policy`, `result_lineage`, `hash` | Results must preserve authorization, lineage, and deterministic ordering. |
| Scheduler Contract | VPR-SS-015 | `job_id`, `schedule`, `target_ref`, `policy`, `attempts`, `window`, `audit_refs`, `replay_ref` | Recurrence and delayed execution must be deterministic and governable. |
| API Infrastructure Contract | VPR-SS-016 | `endpoint_id`, `path`, `method`, `auth_policy`, `request_schema`, `response_schema`, `rate_policy`, `owner`, `version` | Routes must register contracts separately from feature logic. |
| Resource Management Contract | VPR-SS-017 | `allocation_id`, `requester`, `resource_type`, `quota_policy`, `capacity_pool`, `allocation`, `governance_result` | Allocation must be policy-backed and audit-visible. |
| Dependency Graph Contract | VPR-SS-018 | `graph_id`, `nodes`, `edges`, `edge_type`, `blockers`, `cycles`, `ordering`, `lineage_refs` | Graph evaluation must be deterministic and cycle-safe. |
| Contract Validation Contract | VPR-SS-019 | `validation_id`, `subject_ref`, `contract_ref`, `validators`, `result`, `errors`, `fail_closed`, `hash` | Validator ordering and error results must be deterministic. |
| Lineage Service Contract | VPR-SS-020 | `lineage_id`, `subject_ref`, `parents`, `children`, `transformation_refs`, `provenance_refs`, `hash` | Parent-child references are append-only and replayable. |
| Evidence Registry Contract | VPR-SS-021 | `evidence_id`, `source_ref`, `tenant_id`, `classification`, `provenance`, `reliability`, `bindings`, `hash` | Evidence references must be immutable and certification-ready. |

## Shared Service Dependency Graph

```text
Identity Service
  -> Registry Service
  -> API Gateway and Registry

Registry Service
  -> Contract Validation Service
  -> Lineage Service
  -> Audit Ledger Service

Governance Service
  -> Trust Boundary Service
  -> Evidence Registry
  -> Audit Ledger Service
  -> Contract Validation Service

Replay Service
  -> Evidence Storage Service
  -> Lineage Service
  -> Audit Ledger Service
  -> Contract Validation Service

Audit Ledger Service
  -> Identity Service
  -> Lineage Service

Workflow Engine
  -> Governance Service
  -> Event Bus
  -> Scheduler
  -> Replay Service
  -> Audit Ledger Service

Event Bus
  -> Registry Service
  -> Replay Service
  -> Observability Service

Search and Query Service
  -> Registry Service
  -> Evidence Registry
  -> Lineage Service
  -> Trust Boundary Service

Resource Manager
  -> Scheduler
  -> Governance Service
  -> Observability Service

Certification Service
  -> Evidence Registry
  -> Replay Service
  -> Governance Service
  -> Audit Ledger Service
```

Blocked services may appear in the dependency graph as target architecture but may not gate implementation of ready shared services unless explicitly required by the service contract.

## Qualification Evidence Ledger

| Evidence ID | Decision support | Source references |
| --- | --- | --- |
| VPR2-EV-001 | VPR.1 discovery baseline and source capability identities | `docs/vpr-1-platform-capability-discovery.md` |
| VPR2-EV-002 | Shared service suitability for ready capabilities | VPR-PC-003, VPR-PC-005, VPR-PC-006, VPR-PC-010, VPR-PC-014, VPR-PC-021, VPR-PC-022, VPR-PC-024, VPR-PC-027 |
| VPR2-EV-003 | Conditional qualification due to consolidation needs | VPR-PC-001, VPR-PC-002, VPR-PC-004, VPR-PC-009, VPR-PC-011, VPR-PC-016, VPR-PC-018, VPR-PC-019, VPR-PC-020, VPR-PC-023, VPR-PC-025, VPR-PC-026 |
| VPR2-EV-004 | Architecture review requirements for blocked or incomplete platform services | VPR-PC-007, VPR-PC-008, VPR-PC-012, VPR-PC-013, VPR-PC-017 |
| VPR2-EV-005 | Application retention decisions | VPR-PC-028, VPR-PC-029, VPR-PC-030 |
| VPR2-EV-006 | Merge lineage for registry, governance, replay, audit, workflow, observability, certification, search, dependency, and evidence services | VPR-MRG-001 through VPR-MRG-010 |
| VPR2-EV-007 | Ownership validation | Platform Ownership Registry in this artifact |
| VPR2-EV-008 | Contract readiness validation | Shared Service Contract Library in this artifact |
| VPR2-EV-009 | Dependency stability validation | Shared Service Dependency Graph in this artifact |
| VPR2-EV-010 | CCI backlog readiness validation | CCI Implementation Backlog in this artifact |

Qualification evidence is immutable after approval. Later VPR phases may add superseding records, but must not rewrite these decisions.

## Shared Service Decision Ledger

| Decision ID | Service | Outcome | Decision rationale | Replay posture | Governance posture | Certification posture |
| --- | --- | --- | --- | --- | --- | --- |
| VPR2-DEC-001 | Identity Service | `CONDITIONALLY_QUALIFIED` | Reusable identity foundation exists, but autonomy-specific assumptions must be removed. | Replayable after generic contract extraction. | Compatible. | Compatible after identity evidence schema is defined. |
| VPR2-DEC-002 | Registry Service | `CONDITIONALLY_QUALIFIED` | Multiple registries overlap and must normalize to one canonical registry service. | Replayable through append-only version records. | Compatible. | Compatible after registry certification criteria are defined. |
| VPR2-DEC-003 | Governance Service | `QUALIFIED_SHARED_SERVICE` | Governance, policy, and authority are core cross-program infrastructure. | Replayable through governance evidence and audit. | Native. | Native. |
| VPR2-DEC-004 | Replay Service | `QUALIFIED_SHARED_SERVICE` | Deterministic replay is central CCI infrastructure. | Native. | Compatible. | Native. |
| VPR2-DEC-005 | Audit Ledger Service | `QUALIFIED_SHARED_SERVICE` | Append-only ledger and integrity primitives are reusable platform infrastructure. | Native. | Compatible. | Native. |
| VPR2-DEC-006 | Evidence Storage Service | `REQUIRES_ARCHITECTURE_REVIEW` | Storage service is implied but backend independence is not proven. | Requires immutable storage adapter. | Compatible after architecture review. | Compatible after storage certification rules exist. |
| VPR2-DEC-007 | Event Bus | `REQUIRES_MORE_EVIDENCE` | Eventing is implied by workflows, but event registry, routing, subscriptions, and persistence are not explicit. | Requires event replay contract. | Compatible after event governance rules exist. | Requires event certification criteria. |
| VPR2-DEC-008 | Observability Service | `CONDITIONALLY_QUALIFIED` | Telemetry and inspection are reusable; dashboard UI must be split away. | Replayable through audit and event evidence. | Compatible. | Compatible after observability criteria are defined. |
| VPR2-DEC-009 | Trust Boundary Service | `QUALIFIED_SHARED_SERVICE` | Tenant, trust, and isolation boundaries are core platform services. | Replayable through boundary evidence. | Native. | Native. |
| VPR2-DEC-010 | Certification Service | `CONDITIONALLY_QUALIFIED` | Certification kernel qualifies; domain-specific gates remain program services. | Native for kernel. | Native. | Native. |
| VPR2-DEC-011 | Configuration Service | `REQUIRES_ARCHITECTURE_REVIEW` | Configuration files exist, but registry, versioning, distribution, inheritance, and lineage are not canonicalized. | Requires configuration lineage. | Compatible after governance policy binding. | Requires config certification. |
| VPR2-DEC-012 | Secrets Manager | `REQUIRES_MORE_EVIDENCE` | Credential and security evidence exists, but secrets storage, rotation, KMS, and secure distribution are absent. | Audit-only until secrets contract exists. | Compatible after security governance. | Requires security certification. |
| VPR2-DEC-013 | Workflow Engine | `QUALIFIED_SHARED_SERVICE` | Workflow orchestration and state transition foundations are reusable across programs. | Native. | Compatible. | Compatible. |
| VPR2-DEC-014 | Search and Query Service | `CONDITIONALLY_QUALIFIED` | Query patterns are reusable but split by governance, autonomy, and retrieval domains. | Replayable through query lineage. | Compatible. | Compatible after query certification criteria. |
| VPR2-DEC-015 | Scheduler | `REQUIRES_ARCHITECTURE_REVIEW` | Scheduling evidence exists, but canonical job registry and policy engine are absent. | Requires job replay. | Compatible after policy binding. | Requires scheduler certification. |
| VPR2-DEC-016 | API Gateway and Registry | `CONDITIONALLY_QUALIFIED` | Route and schema patterns exist, but gateway/service-discovery implementation is absent. | Replayable at contract level. | Compatible. | Compatible after API certification. |
| VPR2-DEC-017 | Resource Manager | `CONDITIONALLY_QUALIFIED` | Resource scheduling and workload distribution exist, but quotas and allocation vocabulary need normalization. | Replayable after allocation contract. | Compatible. | Compatible after capacity certification. |
| VPR2-DEC-018 | Dependency Graph Service | `CONDITIONALLY_QUALIFIED` | Graph primitives qualify after decision-specific semantics are separated. | Replayable through graph evidence. | Compatible. | Compatible. |
| VPR2-DEC-019 | Contract Validation Service | `QUALIFIED_SHARED_SERVICE` | Deterministic validation core is reusable platform infrastructure. | Native. | Compatible. | Native. |
| VPR2-DEC-020 | Lineage Service | `QUALIFIED_SHARED_SERVICE` | Provenance and lineage are core cross-program infrastructure. | Native. | Compatible. | Native. |
| VPR2-DEC-021 | Evidence Registry | `CONDITIONALLY_QUALIFIED` | Evidence identity and binding qualify as shared domain service; scoring overlays stay separate. | Native. | Compatible. | Native. |
| VPR2-DEC-022 | Mission Control Visibility | `QUALIFIED_APPLICATION_SERVICE` | UI and dashboards are Mission Control application behavior. | Consumes replay; not platform replay. | Consumes governance. | Not a platform certification target. |
| VPR2-DEC-023 | Recommendation Intelligence | `QUALIFIED_APPLICATION_SERVICE` | Recommendation intelligence is application/domain behavior. | Consumes replay. | Consumes governance. | Domain-only. |
| VPR2-DEC-024 | Mission Intelligence and Strategy | `QUALIFIED_APPLICATION_SERVICE` | Mission strategy is application/domain behavior. | Consumes replay. | Consumes governance. | Domain-only. |

## CCI Implementation Backlog

| Backlog rank | Service | Action | Prerequisite |
| --- | --- | --- | --- |
| 1 | Governance Service | Implement CCI core. | Approval of VPR2-DEC-003. |
| 2 | Audit Ledger Service | Implement append-only ledger and integrity core. | Approval of VPR2-DEC-005. |
| 3 | Replay Service | Implement deterministic replay core. | Approval of VPR2-DEC-004. |
| 4 | Contract Validation Service | Implement validation core. | Approval of VPR2-DEC-019. |
| 5 | Lineage Service | Implement lineage/provenance core. | Approval of VPR2-DEC-020. |
| 6 | Trust Boundary Service | Implement tenant and trust boundary core. | Approval of VPR2-DEC-009. |
| 7 | Workflow Engine | Implement workflow/state transition core. | Operator action decoupling plan. |
| 8 | Registry Service | Consolidate registry and contract registry. | VPR-MRG-001 approved. |
| 9 | Identity Service | Extract generic identity contract. | Remove autonomy-specific assumptions. |
| 10 | Observability Service | Extract telemetry and inspection contracts. | Split dashboard UI from telemetry. |
| 11 | Certification Service | Implement certification kernel. | Split domain gates from kernel. |
| 12 | Search and Query Service | Normalize query contracts. | Query vocabulary and authorization contract. |
| 13 | API Gateway and Registry | Define gateway and endpoint registry. | Route registry/service discovery design. |
| 14 | Resource Manager | Normalize quota and capacity vocabulary. | Allocation governance rules. |
| 15 | Dependency Graph Service | Extract generic graph kernel. | Decision-specific type decoupling. |
| 16 | Evidence Registry | Promote evidence identity and binding. | Evidence reliability overlay split. |
| 17 | Configuration Service | Define missing architecture. | Configuration registry/versioning/inheritance design. |
| 18 | Event Bus | Define missing architecture. | Event envelope, registry, routing, persistence, subscriptions. |
| 19 | Scheduler | Define missing architecture. | Job registry and schedule policy engine. |
| 20 | Secrets Manager | Define missing architecture. | Secrets storage, rotation, KMS, distribution, audit model. |

Application services are intentionally excluded from the CCI implementation backlog.

## Constitutional Validation Ledger

| Validation ID | Rule | Result | Notes |
| --- | --- | --- | --- |
| VPR2-VAL-001 | Shared services shall have one canonical owner. | Pass | Every `VPR-SS-*` record maps to one owner. |
| VPR2-VAL-002 | Capabilities shall never be duplicated after qualification. | Conditional pass | Duplicates are captured in merge registry; implementation must enforce canonical references. |
| VPR2-VAL-003 | Equivalent capabilities shall normalize to a single canonical capability. | Pass | Registry, governance, replay, audit, workflow, search, and graph overlaps normalized. |
| VPR2-VAL-004 | Normalization shall preserve all originating lineage. | Pass | Merge registry preserves all source `VPR-PC-*` and evidence references. |
| VPR2-VAL-005 | Merged capabilities shall remain permanently traceable. | Pass | `VPR-MRG-*` records include effective version and authority. |
| VPR2-VAL-006 | Superseded capabilities shall never lose historical references. | Pass | Supersession is represented as retained source lineage, not deletion. |
| VPR2-VAL-007 | Qualification decisions shall be deterministic. | Pass | Decisions use explicit rules, criteria, and outcomes. |
| VPR2-VAL-008 | Qualification shall preserve deterministic replay. | Conditional pass | Ready services satisfy replay posture; experimental services list replay blockers. |
| VPR2-VAL-009 | Qualification evidence shall be immutable. | Pass | Evidence ledger is append-only after approval. |
| VPR2-VAL-010 | Every promoted service shall reference originating Mission Control evidence. | Pass | Each service references VPR.1 source capabilities and evidence. |
| VPR2-VAL-011 | Governance compatibility must be verified. | Pass | Each decision ledger row records governance posture. |
| VPR2-VAL-012 | Certification compatibility must be verified. | Pass | Each decision ledger row records certification posture. |

## Exit Criteria Assessment

| Exit criterion | Status |
| --- | --- |
| Shared services qualified | Satisfied for all VPR.1 capabilities. |
| Normalization complete | Satisfied at qualification level; implementation consolidation remains backlog work. |
| Duplicate capabilities eliminated | Satisfied as design decision through merge registry; code-level consolidation remains future work. |
| Canonical ownership established | Satisfied in platform ownership registry. |
| Merge registry complete | Satisfied for identified duplicate and overlapping service families. |
| Supersession lineage preserved | Satisfied through source capability and merge records. |
| Immutable lineage verified | Satisfied by VPR.1 evidence references and VPR.2 evidence ledger. |
| Deterministic replay validated | Satisfied for qualified shared services; conditional and experimental services list blockers. |
| Governance compatibility verified | Satisfied in decision ledger. |
| Certification compatibility verified | Satisfied in decision ledger. |
| CCI implementation backlog ready | Satisfied for qualified and conditionally qualified services. |

VPR.2 is complete as a shared service qualification baseline. CCI implementation should begin with services marked `QUALIFIED_SHARED_SERVICE`, while conditionally qualified and experimental services must resolve their listed normalization, contract, evidence, or architecture blockers before entering implementation.
