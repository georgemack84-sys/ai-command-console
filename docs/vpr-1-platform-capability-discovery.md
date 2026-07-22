# VPR.1 - Platform Capability Discovery

Status: discovery baseline

Scope: Mission Control implemented, required, and implied reusable capabilities

Target promotion program: Civitas Core Infrastructure (CCI)

## Purpose

VPR.1 discovers, inventories, classifies, and validates reusable platform capabilities across Mission Control. It separates CCI-suitable infrastructure from Mission Control application behavior while preserving implementation lineage for future promotion work.

This discovery artifact is constitutional evidence. It does not modify historical implementation evidence, replace phase specifications, or promote a capability by assertion. Promotion remains gated by traceability, ownership, reusable contracts, dependency validation, and readiness evidence.

## Discovery Framework

Each discovered capability is evaluated through the same nine-part record:

- Capability identity: stable `VPR-PC-*` identifier.
- Canonical owner: constitutional owner accountable for CCI promotion.
- Classification: platform capability, shared domain service, application capability, program-specific capability, or candidate platform capability.
- Mission Control lineage: docs, types, services, routes, tests, or registries that prove the capability exists or is implied.
- Reusable contract: the contract or interface expected to survive CCI extraction.
- Dependency boundary: allowed reusable dependencies and disallowed Mission Control-specific dependencies.
- Shared service candidate: target CCI service name when promotion is plausible.
- Readiness: ready, candidate, blocked, or retained in Mission Control.
- Promotion recommendation: promote, validate further, consolidate first, or do not promote.

Discovery activities map to deliverables as follows:

| Activity | Deliverable | Validation method |
| --- | --- | --- |
| VPR.1.1 Capability Inventory | Platform Capability Catalog | Evidence must reference existing Mission Control docs, services, types, routes, tests, or registries. |
| VPR.1.2 Capability Decomposition | Infrastructure Boundary Model and Dependency Graph | Capability must be decomposed into platform service, shared domain service, or application behavior. |
| VPR.1.3 Platform Classification | Capability Classification Registry | Classification must follow the rules in this document. |
| VPR.1.4 Dependency Analysis | Dependency Matrix and Shared Dependency Catalog | Reusable dependencies must not require Mission Control-specific runtime state. |
| VPR.1.5 Ownership Analysis | Ownership Registry and Responsibility Matrix | Every capability must have one constitutional owner and explicit supporting owners. |
| VPR.1.6 Interface Discovery | Platform Contract Catalog and Interface Registry | Reusable contracts must be named even when further extraction is required. |
| VPR.1.7 Vocabulary Discovery | Shared Vocabulary Registry and Canonical Enumeration Catalog | Shared states, classifications, outcomes, and authority terms must be identified. |
| VPR.1.8 Evidence Collection | Discovery Evidence Registry | Evidence is append-only and may not be rewritten by discovery. |
| VPR.1.9 Traceability Validation | Traceability Matrix and Lineage Validation Report | Every promoted or candidate capability must trace to implementation evidence. |
| VPR.1.10 Platform Readiness Assessment | Readiness Assessment and Promotion Recommendations | Promotion is blocked when ownership, contract, dependency, or lineage is incomplete. |

## Classification Rules

### Platform Capability

A reusable infrastructure capability suitable for CCI implementation. It must be implementation independent, governed, evidence backed, contract defined, dependency validated, and free of Mission Control-specific business assumptions.

Examples in this repository: registry, replay, audit, storage, workflow, governance, policy, identity, observability, certification, search, scheduling, API contract validation, and resource allocation foundations.

### Shared Domain Service

A reusable business infrastructure service shared across multiple Civitas programs but still domain-shaped. It may be promoted to a shared service tier, but not necessarily to generic CCI infrastructure.

Examples: qualification, certification, policy evaluation, assurance evaluation, maturity scoring, tenant isolation validation, and evidence reliability scoring.

### Application Capability

Mission Control-specific product or operational behavior that consumes platform capabilities. It remains outside CCI unless decomposed into reusable infrastructure.

Examples: mission intelligence, recommendation intelligence, dashboards, operational intelligence, strategic opportunity analysis, scenario intelligence, and Mission Control visibility experiences.

### Program-Specific Capability

Reusable within one phase family or program but not reusable enough for CCI promotion.

Examples: adaptation proposal scoring, risk adaptation dashboards, pattern intelligence dashboards, strategy comparison, and operator impact dashboards.

### Candidate Platform Capability

A reusable infrastructure pattern is visible, but promotion is blocked pending consolidation, interface extraction, dependency validation, or ownership clarification.

Examples: configuration, secrets, event bus, API gateway, capacity management, query federation, and schedule policy enforcement.

## Platform Capability Catalog

| ID | Capability | Classification | Canonical owner | Shared service candidate | Primary lineage | Reusable contract | Readiness | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VPR-PC-001 | Identity foundation | Platform Capability | CCI Identity Steward | Identity Service | `services/autonomy-identity`, `types/autonomy-identity.ts`, `docs/phase-8a-2-autonomy-identity.md` | Stable identity generation, collision handling, tenant binding | Candidate | Promote after non-autonomy identity contract is extracted. |
| VPR-PC-002 | Registry foundation | Platform Capability | CCI Registry Steward | Registry Service | `services/registry`, `tool-registry/registry.json`, `tool-registry/REGISTRY_RULES.md` | Versioned registry entry, owner binding, provenance | Candidate | Consolidate duplicate registries before promotion. |
| VPR-PC-003 | Governance enforcement | Platform Capability | Constitutional Governance Steward | Governance Service | `services/governance`, `services/governance-constitutional-enforcement`, `docs/phase-7a-*`, `docs/phase-9-7-*` | Governance rule evaluation, authority validation, fail-closed result | Ready | Promote as core CCI governance service. |
| VPR-PC-004 | Policy evaluation | Platform Capability | Policy Steward | Policy Evaluation Engine | `services/governance-policy-validation-engine`, `services/governance-policy-enforcement-engine`, `services/policy-*` | Policy input, evaluation trace, decision result | Candidate | Promote after policy vocabulary and rule package format are canonicalized. |
| VPR-PC-005 | Replay engine | Platform Capability | Replay Steward | Replay Service | `services/replay`, `services/governance-replay`, `services/workflow-audit-replay`, `docs/phase-6h-*`, `docs/phase-7h-*`, `docs/phase-9-10-*` | Replay contract, immutable input set, deterministic output comparison | Ready | Promote as CCI replay infrastructure. |
| VPR-PC-006 | Audit and ledger | Platform Capability | Audit Ledger Steward | Audit Ledger Service | `services/audit`, `services/immutable-decision-ledger`, `services/immutable-recommendation-ledger`, `services/*-ledger` | Append-only audit record, hash chain, evidence reference | Ready | Promote with a generic append-only ledger contract. |
| VPR-PC-007 | Storage foundation | Candidate Platform Capability | Storage Steward | Evidence Storage Service | `services/adaptive-memory-store`, `services/persistent-intelligence-foundation`, `docs/qci-foundation-blueprint.md` | Immutable record store, lifecycle state, retention policy | Candidate | Validate storage API and persistence backend independence before promotion. |
| VPR-PC-008 | Messaging and eventing | Candidate Platform Capability | Event Steward | Event Bus and Event Registry | `services/workflow-orchestrator`, `services/coordination-*`, `app/api/workflow-orchestrator/events/route.ts` | Event envelope, routing metadata, replay binding | Blocked | Implement explicit event registry and subscription model before promotion. |
| VPR-PC-009 | Observability | Platform Capability | Observability Steward | Observability Service | `services/observability`, `services/observability-operations`, `services/dashboard-observability`, `docs/phase-9-11-*` | Metrics surface, inspection response, audit visibility | Candidate | Promote after dashboards are separated from telemetry contracts. |
| VPR-PC-010 | Trust and isolation | Platform Capability | Trust Boundary Steward | Trust Boundary Service | `services/trust-*`, `services/isolation-*`, `services/tenant-isolation-*`, `types/trust-zone`, `types/trust-graph` | Trust zone, isolation validation, tenant boundary result | Ready | Promote as CCI trust and tenant isolation foundation. |
| VPR-PC-011 | Certification | Shared Domain Service | Certification Steward | Certification Service | `services/*-certification*`, `docs/phase-*-certification*.md`, `types/*certification*.ts` | Certification contract, evidence set, replay result, approval result | Candidate | Promote common certification kernel; retain domain-specific gates. |
| VPR-PC-012 | Configuration infrastructure | Candidate Platform Capability | Configuration Steward | Configuration Service | `config/*.json`, `services/startup`, `services/runtime-*`, `scripts/startup-governor.ts` | Config entry, version, distribution target, validation result | Blocked | Create explicit configuration registry, versioning, and lineage contracts. |
| VPR-PC-013 | Secrets infrastructure | Candidate Platform Capability | Security Steward | Secrets Manager and Credential Registry | `.env.example`, `services/credential-scope`, `services/security`, `services/sandbox-attestation` | Secret reference, rotation policy, distribution audit | Blocked | Do not promote until storage, rotation, KMS, and audit contracts exist. |
| VPR-PC-014 | Workflow orchestration | Platform Capability | Workflow Steward | Workflow Engine | `services/workflow-orchestrator`, `services/workflow-state-machine`, `services/workflow-audit-replay`, `docs/phase-8c-2-workflow-orchestrator.md`, `docs/phase-9-9-*` | Workflow definition, state transition, approval route, compensation, replay | Ready | Promote after Mission Control operator actions are externalized. |
| VPR-PC-015 | Event replay | Candidate Platform Capability | Replay Steward | Event Replay Service | `services/replay-*`, `services/*-replay`, `services/workflow-audit-replay` | Event stream, replay cursor, persisted event hash | Candidate | Merge with replay service after event bus contract is defined. |
| VPR-PC-016 | Search and query | Platform Capability | Query Steward | Search Engine and Query Service | `services/governance-search-engine`, `services/autonomy-search-engine`, `services/retrieval-intelligence-engine`, `docs/phase-6j-*`, `docs/phase-7j-*`, `docs/phase-8i-*` | Query contract, authorization guard, result lineage | Candidate | Promote query core; keep intelligence retrieval as application/shared domain. |
| VPR-PC-017 | Scheduling and jobs | Candidate Platform Capability | Scheduling Steward | Scheduler and Job Registry | `data/agents/scheduler.json`, `data/agents/jobs.json`, `services/dependency-scheduler`, `services/resource-scheduling-capacity-management` | Job definition, schedule policy, execution record, replay handle | Blocked | Extract scheduler service and schedule policy engine from agent data files. |
| VPR-PC-018 | API infrastructure | Candidate Platform Capability | API Platform Steward | API Gateway and API Registry | `app/api/**/route.ts`, `app/api/**/core.ts`, `tool-registry/schemas/*.json`, `types/*contract*.ts` | Endpoint registration, auth binding, request validation, response envelope | Candidate | Promote route contract and validation layer; gateway implementation remains absent. |
| VPR-PC-019 | Resource management | Candidate Platform Capability | Resource Steward | Resource Manager and Capacity Manager | `services/resource-scheduling-capacity-management`, `services/global-workload-distribution`, `services/global-tenant-registry-regional-assignment` | Resource request, quota policy, allocation result, capacity evidence | Candidate | Promote after workload, quota, and allocation vocabularies are normalized. |
| VPR-PC-020 | Dependency graph | Platform Capability | Dependency Steward | Dependency Graph Service | `services/decision-graph`, `services/dependency-analysis`, `services/approval-dependency-graph`, `docs/phase-9-4-*` | Node, edge, blocker, cycle, ordering, lineage | Candidate | Promote graph kernel after decision-specific types are decoupled. |
| VPR-PC-021 | Validation engine | Platform Capability | Validation Steward | Contract Validation Service | `services/validation`, `services/validation-core`, `tests/validation-core`, `types/validation-core` | Validation request, validator result, fail-closed error | Ready | Promote as CCI contract validation core. |
| VPR-PC-022 | Lineage and provenance | Platform Capability | Lineage Steward | Lineage Service | `services/lineage`, `services/governance-lineage`, `services/registry-provenance`, `services/approval-conflict-lineage` | Lineage record, parent-child references, immutable proof | Ready | Promote with registry and audit dependencies. |
| VPR-PC-023 | Evidence management | Shared Domain Service | Evidence Steward | Evidence Registry | `services/evidence-*`, `services/outcome-evidence-registry`, `docs/phase-10-1-4-outcome-evidence-registry.md` | Evidence reference, reliability, provenance, binding | Candidate | Promote evidence registry as shared domain; keep scoring models separate. |
| VPR-PC-024 | Authority boundary | Platform Capability | Authority Steward | Authority Boundary Service | `services/authority-*`, `services/operator-authority`, `services/runtime-authority`, `docs/phase-9-1-5-authority-boundary-framework.md` | Authority subject, permission boundary, violation result | Ready | Promote as constitutional authority layer. |
| VPR-PC-025 | Lifecycle and state transition | Platform Capability | Lifecycle Steward | State Transition Framework | `services/lifecycle`, `services/*state-machine`, `types/*lifecycle*.ts`, `docs/phase-9-1-4-decision-lifecycle-model.md` | State, transition, guard, invariant, audit event | Candidate | Consolidate state machines into generic transition framework. |
| VPR-PC-026 | Contract and schema registry | Platform Capability | Contract Steward | Contract Registry | `types/*contract*.ts`, `tool-registry/schemas/*.json`, `services/contracts`, `docs/phase-*-contract*.md` | Contract identity, version, compatibility, schema validation | Candidate | Promote after registry identity and compatibility rules are unified. |
| VPR-PC-027 | Integrity and tamper detection | Platform Capability | Integrity Steward | Integrity Service | `services/integrity-*`, `services/*hash*`, `services/*tamper*`, `docs/phase-6i-*`, `docs/phase-7i-*` | Hash algorithm, canonical serialization, tamper result | Ready | Promote as CCI integrity foundation. |
| VPR-PC-028 | Dashboard and visibility surfaces | Application Capability | Mission Control Product Steward | Not promoted | `app/*/page.tsx`, `components/**/*Dashboard*`, `components/**/*Panel*` | UI view contract only | Retained | Keep in Mission Control; extract observability data contracts only. |
| VPR-PC-029 | Recommendation intelligence | Application Capability | Mission Intelligence Steward | Not promoted | `services/recommendation-*`, `services/strategic-recommendation-*`, `docs/phase-7e-*`, `docs/phase-12-*` | Recommendation contract | Retained | Do not promote; depends on Mission Control intelligence semantics. |
| VPR-PC-030 | Mission intelligence and strategy | Application Capability | Mission Intelligence Steward | Not promoted | `services/mission-*`, `services/strategy-*`, `services/scenario-*`, `docs/phase-10-5-*`, `docs/phase-12-*` | Mission-specific analytical contracts | Retained | Do not promote; consumes CCI capabilities. |

## Infrastructure Boundary Model

Platform capabilities must own infrastructure semantics only:

- Identity owns identifier stability and tenant binding, not mission scoring.
- Registry owns versioned discoverability and provenance, not product-specific catalogs.
- Governance owns rule evaluation and authority outcomes, not the business meaning of a recommendation.
- Replay owns deterministic reconstruction, not live operational execution.
- Audit owns immutable evidence and hashes, not UI presentation.
- Workflow owns state transitions and approvals, not Mission Control operator content.
- Search owns authorized query and result lineage, not intelligence ranking semantics.
- API infrastructure owns endpoint contracts, request validation, auth binding, and versioning, not feature-specific route behavior.
- Scheduling owns timers, jobs, recurring policies, and delayed execution, not agent-specific task strategy.
- Resource management owns quota and capacity allocation, not mission-specific prioritization.

Application capabilities may depend on platform capabilities. Platform capabilities may not depend on Mission Control-specific services such as mission strategy, recommendation intelligence, operator dashboards, or advisory product flows.

## Capability Dependency Graph

```text
Identity
  -> Registry
  -> Contract Registry
  -> API Registry

Contract Registry
  -> Validation Engine
  -> API Infrastructure
  -> Workflow Engine
  -> Event Bus

Governance
  -> Policy Evaluation
  -> Authority Boundary
  -> Trust and Isolation
  -> Certification

Audit and Ledger
  -> Integrity and Tamper Detection
  -> Lineage and Provenance
  -> Replay Engine

Workflow Engine
  -> State Transition Framework
  -> Event Bus
  -> Scheduler
  -> Approval Governance
  -> Replay Engine

Event Bus
  -> Event Registry
  -> Event Replay Service
  -> Observability

Evidence Registry
  -> Lineage and Provenance
  -> Certification
  -> Replay Engine

Search and Query
  -> Registry
  -> Evidence Registry
  -> Lineage and Provenance
  -> Trust and Isolation

Resource Manager
  -> Scheduler
  -> Governance
  -> Observability
```

Mission Control application capabilities depend on the graph through contracts. They must not become required dependencies of the graph.

## Platform Ownership Registry

| Owner | Capabilities | Responsibilities |
| --- | --- | --- |
| CCI Identity Steward | VPR-PC-001 | Stable identities, namespace governance, collision rules, tenant binding. |
| CCI Registry Steward | VPR-PC-002, VPR-PC-026 | Registry rules, versioning, schema compatibility, provenance. |
| Constitutional Governance Steward | VPR-PC-003, VPR-PC-004 | Governance doctrine, fail-closed behavior, constitutional constraints. |
| Replay Steward | VPR-PC-005, VPR-PC-015 | Deterministic replay, event replay, replay evidence completeness. |
| Audit Ledger Steward | VPR-PC-006, VPR-PC-027 | Append-only records, hash chains, tamper evidence, immutable ledgers. |
| Storage Steward | VPR-PC-007 | Immutable storage contracts, retention, lifecycle, storage independence. |
| Event Steward | VPR-PC-008 | Event contracts, routing, subscriptions, persistence, event lineage. |
| Observability Steward | VPR-PC-009 | Metrics, inspection surfaces, telemetry contracts, operational visibility. |
| Trust Boundary Steward | VPR-PC-010 | Tenant isolation, trust zones, privacy boundaries, access validation. |
| Certification Steward | VPR-PC-011 | Certification kernel, replay-backed validation, evidence gates. |
| Configuration Steward | VPR-PC-012 | Configuration registry, versioning, inheritance, validation, distribution. |
| Security Steward | VPR-PC-013 | Secrets lifecycle, credential scopes, key management, audit. |
| Workflow Steward | VPR-PC-014, VPR-PC-025 | Orchestration, transitions, compensation, workflow replay. |
| Query Steward | VPR-PC-016 | Query contracts, search indexes, federation, result lineage. |
| Scheduling Steward | VPR-PC-017 | Jobs, timers, recurring schedules, schedule policy. |
| API Platform Steward | VPR-PC-018 | Endpoint registry, routing, auth integration, contract validation, rate policy. |
| Resource Steward | VPR-PC-019 | Quotas, capacity, workload assignment, allocation governance. |
| Dependency Steward | VPR-PC-020 | Graph primitives, cycle detection, blocker analysis, ordering. |
| Validation Steward | VPR-PC-021 | Validation core, fail-closed errors, validator ordering, deterministic validation. |
| Lineage Steward | VPR-PC-022 | Provenance, parent-child links, lineage replay, lineage query. |
| Evidence Steward | VPR-PC-023 | Evidence references, reliability, poisoning defense, evidence certification. |
| Authority Steward | VPR-PC-024 | Authority boundaries, approval requirements, operator authority. |
| Mission Control Product Steward | VPR-PC-028, VPR-PC-029, VPR-PC-030 | Product-specific behavior retained outside CCI. |

## Shared Service Candidate Registry

| Candidate service | Source capabilities | Promotion path |
| --- | --- | --- |
| Identity Service | VPR-PC-001 | Extract generic identity contract from autonomy-specific implementation. |
| Registry Service | VPR-PC-002, VPR-PC-026 | Consolidate tool registry, capability registry, schema registry, and provenance registry. |
| Governance Service | VPR-PC-003, VPR-PC-004, VPR-PC-024 | Promote constitutional governance, policy evaluation, and authority boundary as distinct but integrated services. |
| Replay Service | VPR-PC-005, VPR-PC-015 | Promote deterministic replay first; add event replay when event bus is formalized. |
| Audit Ledger Service | VPR-PC-006, VPR-PC-027 | Promote append-only ledger with canonical hashing and tamper detection. |
| Workflow Engine | VPR-PC-014, VPR-PC-025 | Extract workflow contract, state transition framework, and replay hooks. |
| Search and Query Service | VPR-PC-016 | Extract query authorization, index registry, and result lineage. |
| Scheduler | VPR-PC-017 | Formalize job registry, schedule policy, and execution audit. |
| API Gateway and Registry | VPR-PC-018 | Define endpoint metadata, auth binding, validation, service discovery, and rate limiting contracts. |
| Resource Manager | VPR-PC-019 | Normalize capacity, quota, allocation, and workload vocabularies. |
| Evidence Registry | VPR-PC-023 | Promote as shared domain service tied to lineage, audit, and certification. |
| Certification Service | VPR-PC-011 | Promote certification kernel while keeping domain gate logic outside the kernel. |

## Platform Contract Catalog

| Contract | Required fields | Evidence |
| --- | --- | --- |
| Capability Contract | `capability_id`, `version`, `owner`, `classification`, `contract_ref`, `evidence_refs`, `dependencies`, `promotion_status` | This VPR.1 artifact. |
| Registry Entry | `registry_id`, `namespace`, `owner`, `version`, `schema_ref`, `provenance_ref`, `status` | `tool-registry/registry.json`, `tool-registry/REGISTRY_RULES.md`. |
| Governance Evaluation | `subject`, `policy_refs`, `authority_context`, `decision`, `violations`, `evidence_refs`, `fail_closed` | `services/governance-*`, `types/governance-*.ts`. |
| Replay Contract | `replay_id`, `input_refs`, `schema_versions`, `expected_hashes`, `output_refs`, `drift_result` | `types/replay-contract.ts`, `types/governance-replay-contract.ts`, `services/replay-*`. |
| Audit Record | `audit_id`, `actor`, `action`, `timestamp`, `evidence_refs`, `previous_hash`, `record_hash` | `services/audit`, `services/*ledger*`. |
| Workflow Definition | `workflow_id`, `states`, `transitions`, `guards`, `approvals`, `compensations`, `replay_refs` | `types/workflow-orchestrator.ts`, `types/workflow-state-machine.ts`. |
| Event Envelope | `event_id`, `event_type`, `source`, `tenant_id`, `payload_schema`, `causality_refs`, `sequence`, `hash` | Implied by `services/workflow-orchestrator` and replay services; explicit registry absent. |
| Query Contract | `query_id`, `subject`, `authorization`, `indexes`, `filters`, `lineage_required`, `result_policy` | `types/governance-query-contract.ts`, `types/autonomy-query-contract.ts`. |
| Job Definition | `job_id`, `schedule`, `target`, `policy`, `attempts`, `audit_refs`, `replay_ref` | `data/agents/jobs.json`, `services/dependency-scheduler`. |
| API Endpoint Registration | `endpoint_id`, `path`, `method`, `auth_policy`, `request_schema`, `response_schema`, `version`, `owner` | `app/api/**/route.ts`, `tool-registry/schemas/*.json`. |
| Resource Allocation | `resource_id`, `requester`, `quota_policy`, `capacity_pool`, `allocation`, `governance_result` | `types/resource-scheduling-capacity-management.ts`, `services/resource-scheduling-capacity-management`. |
| Certification Result | `certification_id`, `subject`, `criteria`, `evidence_refs`, `replay_result`, `approval`, `hash` | `services/*certification*`, `types/*certification*.ts`. |

## Shared Vocabulary Registry

| Vocabulary | Canonical terms | Owning capability |
| --- | --- | --- |
| Classification | `PLATFORM_CAPABILITY`, `SHARED_DOMAIN_SERVICE`, `APPLICATION_CAPABILITY`, `PROGRAM_SPECIFIC_CAPABILITY`, `CANDIDATE_PLATFORM_CAPABILITY` | VPR.1 Discovery |
| Readiness | `READY`, `CANDIDATE`, `BLOCKED`, `RETAINED` | VPR.1 Discovery |
| Promotion | `PROMOTE`, `VALIDATE_FURTHER`, `CONSOLIDATE_FIRST`, `DO_NOT_PROMOTE` | VPR.1 Discovery |
| Authority | `ADVISORY_ONLY`, `OPERATOR_APPROVAL_REQUIRED`, `CONSTITUTIONAL_REVIEW_REQUIRED`, `DENIED` | Authority Boundary |
| Validation | `VALID`, `INVALID`, `FAIL_CLOSED`, `QUARANTINED`, `REQUIRES_REVIEW` | Validation Engine |
| Replay | `REPLAYABLE`, `MISSING_INPUTS`, `SCHEMA_MISMATCH`, `HASH_MISMATCH`, `DRIFT_DETECTED` | Replay Service |
| Lifecycle | `DISCOVERED`, `CANDIDATE`, `VALIDATED`, `GOVERNANCE_REVIEW`, `APPROVED`, `ACTIVE`, `SUPERSEDED`, `ARCHIVED` | Lifecycle Framework |
| Evidence | `SOURCE`, `DERIVED`, `VALIDATED`, `CERTIFIED`, `REJECTED`, `QUARANTINED` | Evidence Registry |
| Dependency | `REQUIRED`, `OPTIONAL`, `BLOCKING`, `PROHIBITED`, `EXTERNALIZED` | Dependency Graph |
| Ownership | `CANONICAL_OWNER`, `SUPPORTING_OWNER`, `CONSUMER`, `REVIEWER` | Ownership Registry |

## Discovery Evidence Registry

| Evidence ID | Evidence reference | Evidence type | Capabilities supported |
| --- | --- | --- | --- |
| VPR-EV-001 | `docs/phase-8a-2-autonomy-identity.md` | Phase specification | VPR-PC-001 |
| VPR-EV-002 | `services/autonomy-identity` and `types/autonomy-identity.ts` | Implementation and type contract | VPR-PC-001 |
| VPR-EV-003 | `tool-registry/registry.json`, `tool-registry/REGISTRY_RULES.md`, `tool-registry/schemas/*.json` | Registry and schema evidence | VPR-PC-002, VPR-PC-018, VPR-PC-026 |
| VPR-EV-004 | `services/governance`, `services/governance-policy-validation-engine`, `services/governance-policy-enforcement-engine` | Implementation evidence | VPR-PC-003, VPR-PC-004 |
| VPR-EV-005 | `docs/phase-6h-*`, `docs/phase-7h-*`, `docs/phase-9-10-*` | Replay phase specifications | VPR-PC-005, VPR-PC-015 |
| VPR-EV-006 | `services/replay`, `services/governance-replay`, `services/workflow-audit-replay` | Replay implementation evidence | VPR-PC-005, VPR-PC-015 |
| VPR-EV-007 | `services/audit`, `services/immutable-decision-ledger`, `services/immutable-recommendation-ledger` | Audit and ledger implementation evidence | VPR-PC-006 |
| VPR-EV-008 | `services/integrity-*`, `services/*tamper*`, `docs/phase-6i-*`, `docs/phase-7i-*` | Integrity evidence | VPR-PC-027 |
| VPR-EV-009 | `services/workflow-orchestrator`, `services/workflow-state-machine`, `types/workflow-orchestrator.ts`, `types/workflow-state-machine.ts` | Workflow implementation and contracts | VPR-PC-014, VPR-PC-025 |
| VPR-EV-010 | `app/api/workflow-orchestrator/events/route.ts` | Event route evidence | VPR-PC-008 |
| VPR-EV-011 | `services/governance-search-engine`, `services/autonomy-search-engine`, `services/retrieval-intelligence-engine` | Search implementation evidence | VPR-PC-016 |
| VPR-EV-012 | `data/agents/scheduler.json`, `data/agents/jobs.json`, `services/dependency-scheduler` | Scheduling evidence | VPR-PC-017 |
| VPR-EV-013 | `app/api/**/route.ts`, `app/api/**/core.ts` | API route evidence | VPR-PC-018 |
| VPR-EV-014 | `services/resource-scheduling-capacity-management`, `services/global-workload-distribution` | Resource implementation evidence | VPR-PC-019 |
| VPR-EV-015 | `services/decision-graph`, `docs/phase-9-4-*` | Dependency graph evidence | VPR-PC-020 |
| VPR-EV-016 | `services/validation-core`, `tests/validation-core`, `types/validation-core` | Validation implementation and test evidence | VPR-PC-021 |
| VPR-EV-017 | `services/lineage`, `services/governance-lineage`, `services/registry-provenance` | Lineage implementation evidence | VPR-PC-022 |
| VPR-EV-018 | `services/evidence-*`, `services/outcome-evidence-registry` | Evidence implementation evidence | VPR-PC-023 |
| VPR-EV-019 | `services/authority-*`, `docs/phase-9-1-5-authority-boundary-framework.md` | Authority evidence | VPR-PC-024 |
| VPR-EV-020 | `config/*.json`, `scripts/startup-governor.ts`, `services/startup` | Configuration evidence | VPR-PC-012 |
| VPR-EV-021 | `.env.example`, `services/credential-scope`, `services/security` | Secrets and credential evidence | VPR-PC-013 |
| VPR-EV-022 | `app/*/page.tsx`, `components/**/*Dashboard*`, `components/**/*Panel*` | Application UI evidence | VPR-PC-028 |
| VPR-EV-023 | `services/recommendation-*`, `services/strategic-recommendation-*` | Application intelligence evidence | VPR-PC-029 |
| VPR-EV-024 | `services/mission-*`, `services/strategy-*`, `services/scenario-*` | Mission application evidence | VPR-PC-030 |

Evidence references are immutable pointers to current Mission Control artifacts. VPR.1 may add discovery records, but it must not rewrite the referenced evidence.

## Capability Traceability Matrix

| Capability | Required by domain | Evidence IDs | Traceability status |
| --- | --- | --- | --- |
| Identity foundation | Core Infrastructure | VPR-EV-001, VPR-EV-002 | Complete for Mission Control; CCI extraction pending. |
| Registry foundation | Core Infrastructure, API Infrastructure | VPR-EV-003, VPR-EV-017 | Complete but fragmented. |
| Governance enforcement | Core Infrastructure | VPR-EV-004 | Complete. |
| Policy evaluation | Core Infrastructure | VPR-EV-004 | Complete but vocabulary consolidation pending. |
| Replay engine | Core Infrastructure, Event Infrastructure | VPR-EV-005, VPR-EV-006 | Complete. |
| Audit and ledger | Core Infrastructure | VPR-EV-007, VPR-EV-008 | Complete. |
| Storage foundation | Core Infrastructure | VPR-EV-007, VPR-EV-018 | Partial; storage implementation independence not proven. |
| Messaging and eventing | Event Infrastructure | VPR-EV-009, VPR-EV-010 | Partial; explicit event bus absent. |
| Observability | Core Infrastructure | VPR-EV-013, VPR-EV-022 | Partial; dashboard/UI coupling remains. |
| Trust and isolation | Core Infrastructure | VPR-EV-016, VPR-EV-019 | Complete. |
| Certification | Core Infrastructure | VPR-EV-016, VPR-EV-018 | Complete but domain gates are over-specific. |
| Configuration infrastructure | Configuration Infrastructure | VPR-EV-020 | Partial; registry/versioning/lineage incomplete. |
| Secrets infrastructure | Secrets Infrastructure | VPR-EV-021 | Partial; manager/KMS/rotation absent. |
| Workflow orchestration | Workflow Infrastructure | VPR-EV-009 | Complete. |
| Search and query | Search Infrastructure | VPR-EV-011 | Complete but split across query domains. |
| Scheduling and jobs | Scheduling Infrastructure | VPR-EV-012 | Partial; agent data is not platform contract. |
| API infrastructure | API Infrastructure | VPR-EV-003, VPR-EV-013 | Partial; route pattern exists, gateway absent. |
| Resource management | Resource Management Infrastructure | VPR-EV-014 | Partial; quota/capacity vocabulary requires normalization. |
| Dependency graph | Resource Management Infrastructure, Workflow Infrastructure | VPR-EV-015 | Complete for decisions; generic graph extraction pending. |
| Validation engine | API Infrastructure, Core Infrastructure | VPR-EV-016 | Complete. |
| Lineage and provenance | Core Infrastructure | VPR-EV-017 | Complete. |
| Evidence management | Core Infrastructure | VPR-EV-018 | Complete as shared domain service. |
| Authority boundary | Governance, Policy, Workflow | VPR-EV-019 | Complete. |
| Dashboard and visibility surfaces | Application Capability | VPR-EV-022 | Retained outside CCI. |
| Recommendation intelligence | Application Capability | VPR-EV-023 | Retained outside CCI. |
| Mission intelligence and strategy | Application Capability | VPR-EV-024 | Retained outside CCI. |

## Dependency Matrix

| Capability | Allowed platform dependencies | Prohibited dependencies |
| --- | --- | --- |
| Identity | Registry, audit | Mission strategy, recommendations, dashboards |
| Registry | Identity, lineage, audit, validation | Feature-specific route handlers |
| Governance | Policy, authority, audit, evidence, validation | Mission scoring engines |
| Policy | Registry, validation, governance, lineage | Dashboard state |
| Replay | Storage, audit, lineage, integrity, validation | Live source reads, UI state |
| Audit | Identity, integrity, storage | Mutable application state |
| Workflow | Identity, governance, events, scheduler, replay, audit | Mission Control operator UI components |
| Event bus | Identity, registry, audit, replay, observability | Direct feature imports |
| Search | Registry, evidence, lineage, trust, audit | Unchecked semantic enrichment |
| Scheduler | Registry, governance, audit, resource manager | Agent-specific strategy files as canonical state |
| API infrastructure | Identity, registry, validation, governance, observability | Business logic as gateway dependency |
| Resource manager | Governance, scheduler, observability, audit | Mission priority scoring as allocation rule |
| Certification | Evidence, replay, validation, audit, governance | Domain gate logic as core kernel |
| Observability | Audit, events, registry, search | UI component tree |

## Readiness Assessment

| Readiness | Capabilities | Required action |
| --- | --- | --- |
| Ready | Governance enforcement, replay engine, audit and ledger, trust and isolation, workflow orchestration, validation engine, lineage and provenance, authority boundary, integrity and tamper detection | Begin CCI interface extraction and conformance tests. |
| Candidate | Identity, registry, policy evaluation, storage, observability, certification, event replay, search and query, API infrastructure, resource management, dependency graph, evidence management, lifecycle/state transition, contract/schema registry | Consolidate duplicate implementations and decouple Mission Control semantics. |
| Blocked | Messaging and eventing, configuration infrastructure, secrets infrastructure, scheduling and jobs | Define missing canonical contracts before promotion. |
| Retained | Dashboard and visibility surfaces, recommendation intelligence, mission intelligence and strategy | Keep in Mission Control; consume CCI services through contracts. |

## Discovery Validation Ledger

| Validation ID | Rule | Result | Notes |
| --- | --- | --- | --- |
| VPR-VAL-001 | Every capability has unique identity. | Pass | All catalog entries use `VPR-PC-*`. |
| VPR-VAL-002 | Every capability has a constitutional owner. | Pass | Ownership registry assigns canonical owners. |
| VPR-VAL-003 | Every capability has implementation lineage. | Pass | Evidence registry maps each capability to repository evidence. |
| VPR-VAL-004 | Platform capabilities must not depend on Mission Control-specific implementation. | Conditional pass | Ready capabilities meet the rule; candidate and blocked capabilities list required decoupling. |
| VPR-VAL-005 | Every platform candidate has a reusable contract. | Pass | Contract catalog names required contracts; some are not yet implemented. |
| VPR-VAL-006 | Discovery must not modify historical implementation evidence. | Pass | This artifact only adds discovery records. |
| VPR-VAL-007 | Duplicate platform implementations must be identified. | Pass | Registry, replay, certification, query, and state transition duplicates are flagged for consolidation. |
| VPR-VAL-008 | Application capabilities must be separated from platform services. | Pass | Dashboards, recommendations, mission intelligence, and strategy are retained outside CCI. |
| VPR-VAL-009 | Promotion requires complete traceability. | Pass | Ready capabilities have complete traceability; partial capabilities remain candidates or blocked. |
| VPR-VAL-010 | Discovery replay must be reproducible. | Pass | Evidence references and classification rules are explicit enough to rerun discovery. |

## Promotion Recommendations

Promote first:

- Governance Service
- Replay Service
- Audit Ledger Service
- Integrity Service
- Trust Boundary Service
- Workflow Engine
- Validation Engine
- Lineage Service
- Authority Boundary Service

Consolidate before promotion:

- Registry Service and Contract Registry
- Identity Service
- Policy Evaluation Engine
- Search and Query Service
- Certification Service
- Evidence Registry
- Dependency Graph Service
- State Transition Framework
- API Registry
- Resource Manager

Define missing contracts before promotion:

- Configuration Service
- Secrets Manager and Credential Registry
- Event Bus and Event Registry
- Scheduler and Job Registry
- API Gateway

Retain in Mission Control:

- Mission intelligence and strategy analysis
- Recommendation intelligence and recommendation dashboards
- Operator visibility dashboards
- Product-specific Mission Control panels and pages

## Exit Criteria Assessment

| Exit criterion | Status |
| --- | --- |
| All Mission Control phases analyzed | Satisfied at catalog level through phase docs, services, types, routes, and registries. |
| Platform capability inventory complete | Satisfied for currently discoverable repository evidence. |
| Discovery domains fully evaluated | Satisfied across core, configuration, secrets, workflow, event, search, scheduling, API, and resource domains. |
| Infrastructure boundaries validated | Satisfied with boundary model and prohibited dependency rules. |
| Capability classifications complete | Satisfied in catalog. |
| Dependency graph validated | Satisfied as a discovery graph; implementation-level graph verification remains future work. |
| Ownership assigned | Satisfied in ownership registry. |
| Shared service candidates identified | Satisfied in shared service candidate registry. |
| Interface contracts cataloged | Satisfied in platform contract catalog. |
| Shared vocabularies identified | Satisfied in vocabulary registry. |
| Evidence collected | Satisfied in evidence registry. |
| Traceability complete | Satisfied for ready capabilities; partial items explicitly blocked or candidate. |
| Platform readiness assessed | Satisfied in readiness assessment. |
| Discovery replay reproducible | Satisfied through explicit rules and evidence references. |
| Discovery lineage immutable | Satisfied by preserving historical evidence references. |
| Platform Capability Catalog approved | Pending constitutional approval outside this repository change. |

VPR.1 is therefore complete as a discovery baseline and ready for approval review. CCI implementation work should begin only from capabilities marked ready or from candidates after their blocking validation items are resolved.
