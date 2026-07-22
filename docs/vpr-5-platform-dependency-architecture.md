# VPR.5 - Platform Dependency Architecture

Status: dependency architecture baseline

Predecessors:

- [VPR.1 - Platform Capability Discovery](./vpr-1-platform-capability-discovery.md)
- [VPR.2 - Shared Service Qualification](./vpr-2-shared-service-qualification.md)
- [VPR.3 - Service Decomposition](./vpr-3-service-decomposition.md)
- [VPR.4 - Infrastructure Boundary Definition](./vpr-4-infrastructure-boundary-definition.md)

Produces:

- CCI Dependency Specification
- Platform Layer Registry
- Dependency Validation Engine specification
- Dependency Replay Ledger
- Architectural Dependency Report

## Purpose

VPR.5 defines the canonical dependency architecture for all validated platform capabilities extracted from Mission Control. It ensures deterministic layering, constitutional ownership, reusable infrastructure boundaries, and implementation-ready dependency rules for Civitas Core Infrastructure (CCI).

This phase establishes the authoritative dependency model that governs how constitutional, platform, framework, application, and tenant capabilities may interact while preventing circular dependencies, reverse ownership, hidden implementation coupling, and nondeterministic platform evolution.

## Platform Layer Registry

The Platform Layer Registry is the authoritative architectural layer model for CCI.

Allowed dependency direction:

```text
Tenant
  -> Application
  -> Framework
  -> Platform
  -> Constitutional
```

Reverse dependencies are prohibited. Lower layers may expose contracts upward, but they may not import, call, or require upper-layer implementations.

| Layer ID | Layer | Owns | Provides | May depend on | Must not depend on |
| --- | --- | --- | --- | --- | --- |
| CCI-LAYER-001 | Constitutional Layer | Constitutional authority, governance doctrine, certification authority, policy authority, identity authority, evidence doctrine, lineage doctrine, replay doctrine, amendment governance. | Constitutional governance, constitutional policy, identity authority, certification framework, evidence authority, framework governance, amendment governance. | None. | Platform, framework, application, tenant implementations. |
| CCI-LAYER-002 | Platform Layer | Reusable infrastructure shared across the Civitas ecosystem. | Identity, registry, storage, messaging, workflow, scheduling, eventing, search, configuration, secrets, API infrastructure, resource management, replay, audit, validation, lineage, trust. | Constitutional Layer only. | Framework, application, tenant implementations. |
| CCI-LAYER-003 | Framework Layer | Reusable implementation frameworks built on platform capabilities. | Governance framework, policy framework, certification framework, workflow framework, orchestration framework, security framework, observability framework, validation framework. | Platform and Constitutional layers. | Application and tenant implementations. |
| CCI-LAYER-004 | Application Layer | Business and program capabilities that consume platform services and extension points. | Mission Control, QuantEdge CompIntel, Publisher OS, Aurora, APEX, STEVN, application dashboards, program intelligence, product workflows. | Framework, Platform, and Constitutional layers through contracts. | Tenant-specific local state as platform dependency. |
| CCI-LAYER-005 | Tenant Layer | Tenant-specific configuration, policy, customization, workflows, preferences, metadata, operational state. | Tenant configuration, tenant policy, tenant workflows, tenant preferences, tenant metadata, tenant operational data. | Application contracts and approved platform configuration interfaces. | Platform internals, framework internals, constitutional ownership. |

## Dependency Classification Framework

| Dependency class | Provider layer | Consumer layer | Allowed direction | Examples |
| --- | --- | --- | --- | --- |
| Constitutional Dependency | Constitutional | Platform, Framework, Application, Tenant | Consumer depends downward on constitutional authority. | Governance doctrine, identity authority, certification authority, amendment governance. |
| Platform Dependency | Platform | Framework, Application, Tenant through APIs | Consumer depends downward on CCI platform services. | Registry, replay, audit, workflow, search, eventing, configuration, secrets. |
| Framework Dependency | Framework | Application, Tenant through application contracts | Consumer depends downward on reusable framework behavior. | Workflow framework, policy framework, observability framework. |
| Application Dependency | Application | Tenant only | Tenant depends on application contracts and program behavior. | Mission Control dashboard, program workflow, application command surface. |
| Tenant Dependency | Tenant | None as platform provider | Tenant state may be consumed only by owning application through contracts. | Tenant preferences, tenant-specific workflows, tenant operational state. |

Every dependency declares:

- `dependency_id`
- `provider_capability`
- `consumer_capability`
- `provider_layer`
- `consumer_layer`
- `dependency_type`
- `dependency_direction`
- `dependency_strength`
- `dependency_lifecycle`
- `dependency_evidence`
- `dependency_lineage`
- `replay_policy`
- `certification_status`

## Dependency Rules

| Rule ID | Rule | Enforcement |
| --- | --- | --- |
| VPR5-DR-001 | Dependencies flow toward lower architectural layers. | Consumer layer ordinal must be greater than provider layer ordinal. |
| VPR5-DR-002 | Constitutional capabilities never depend on platform implementations. | Constitutional provider records must have no lower-layer imports. |
| VPR5-DR-003 | Platform capabilities never depend on applications. | Platform services cannot reference `CCI-SVC-022` through `CCI-SVC-024` or program implementation modules. |
| VPR5-DR-004 | Frameworks may consume platform capabilities but may not redefine them. | Framework extension records must point to CCI APIs, not duplicate service contracts. |
| VPR5-DR-005 | Applications may consume platform services but never establish platform ownership. | Application dependency records cannot set constitutional owner. |
| VPR5-DR-006 | Tenant implementations consume application contracts only. | Tenant records cannot bind directly to platform internals except approved configuration or identity references. |
| VPR5-DR-007 | Circular dependencies are prohibited. | Dependency graph must be acyclic by layer and by service identity. |
| VPR5-DR-008 | Every dependency is replayable. | Dependency record must include immutable provider, consumer, version, and evidence references. |
| VPR5-DR-009 | Every dependency preserves immutable lineage. | Dependency lineage must trace to VPR.1, VPR.2, VPR.3, or VPR.4 records. |
| VPR5-DR-010 | Every dependency produces certification evidence. | Certification status must be recorded as certified, conditionally certified, pending, or rejected. |
| VPR5-DR-011 | Dependency ownership is explicit. | Provider owner and consumer owner must be named. |
| VPR5-DR-012 | Dependency compatibility is version governed. | Provider API or contract version must be declared. |

## Platform Dependency Model

The dependency model uses five dependency strengths:

| Strength | Meaning | Certification requirement |
| --- | --- | --- |
| Required | Consumer cannot operate without provider. | Mandatory certification before activation. |
| Conditional | Consumer uses provider when a capability profile is enabled. | Profile-specific certification. |
| Optional | Consumer can operate without provider but may improve behavior when available. | Compatibility certification. |
| Extension | Consumer plugs into a provider extension point. | Extension certification. |
| Prohibited | Dependency violates layer or ownership rules. | Rejected and blocked. |

Dependency lifecycle:

```text
DISCOVERED
  -> DECLARED
  -> VALIDATED
  -> CERTIFIED
  -> ACTIVE
  -> SUPERSEDED
  -> ARCHIVED
```

Lifecycle lineage is immutable. Supersession creates a new dependency record and preserves the old dependency for replay and audit.

## Platform Dependency Matrix

| Consumer | Provider dependencies | Dependency strength | Direction status | Certification status |
| --- | --- | --- | --- | --- |
| CCI-SVC-001 Identity Service | CCI-SVC-002 Registry, CCI-SVC-005 Audit Ledger, CCI-SVC-020 Lineage | Required | Valid platform-to-platform foundation dependency | Pending CCI certification |
| CCI-SVC-002 Registry Service | CCI-SVC-001 Identity, CCI-SVC-019 Validation, CCI-SVC-020 Lineage, CCI-SVC-005 Audit Ledger | Required | Valid platform-to-platform foundation dependency | Pending CCI certification |
| CCI-SVC-003 Governance Service | CCI-SVC-002 Registry, CCI-SVC-009 Trust Boundary, CCI-SVC-021 Evidence Registry, CCI-SVC-019 Validation, CCI-SVC-004 Replay, CCI-SVC-005 Audit Ledger | Required | Valid platform dependency with constitutional ownership | Pending CCI certification |
| CCI-SVC-004 Replay Service | CCI-SVC-006 Evidence Storage, CCI-SVC-020 Lineage, CCI-SVC-019 Validation, CCI-SVC-005 Audit Ledger | Required | Valid platform-to-platform dependency | Pending CCI certification |
| CCI-SVC-005 Audit Ledger Service | CCI-SVC-001 Identity, CCI-SVC-020 Lineage | Required | Valid foundation dependency | Pending CCI certification |
| CCI-SVC-006 Evidence Storage Service | CCI-SVC-009 Trust Boundary, CCI-SVC-005 Audit Ledger, CCI-SVC-020 Lineage | Required | Valid, architecture review required | Pending architecture review |
| CCI-SVC-007 Event Bus | CCI-SVC-002 Registry, CCI-SVC-019 Validation, CCI-SVC-004 Replay, CCI-SVC-008 Observability, CCI-SVC-005 Audit Ledger | Required | Valid, event evidence required | Pending event architecture |
| CCI-SVC-008 Observability Service | CCI-SVC-007 Event Bus, CCI-SVC-005 Audit Ledger, CCI-SVC-002 Registry, CCI-SVC-014 Search and Query | Conditional | Valid; event dependency conditional until event bus active | Conditional certification |
| CCI-SVC-009 Trust Boundary Service | CCI-SVC-001 Identity, CCI-SVC-003 Governance, CCI-SVC-005 Audit Ledger, CCI-SVC-002 Registry | Required | Valid platform dependency | Pending CCI certification |
| CCI-SVC-010 Certification Service | CCI-SVC-021 Evidence Registry, CCI-SVC-004 Replay, CCI-SVC-003 Governance, CCI-SVC-019 Validation, CCI-SVC-005 Audit Ledger | Required | Valid platform dependency | Pending CCI certification |
| CCI-SVC-011 Configuration Service | CCI-SVC-002 Registry, CCI-SVC-019 Validation, CCI-SVC-003 Governance, CCI-SVC-005 Audit Ledger, CCI-SVC-020 Lineage | Required | Valid, architecture review required | Pending architecture review |
| CCI-SVC-012 Secrets Manager | CCI-SVC-009 Trust Boundary, CCI-SVC-003 Governance, CCI-SVC-005 Audit Ledger, CCI-SVC-002 Registry | Required | Valid, security evidence required | Pending security architecture |
| CCI-SVC-013 Workflow Engine | CCI-SVC-003 Governance, CCI-SVC-007 Event Bus, CCI-SVC-015 Scheduler, CCI-SVC-004 Replay, CCI-SVC-005 Audit Ledger, CCI-SVC-002 Registry | Required | Valid, event and scheduler dependencies conditional until active | Conditional certification |
| CCI-SVC-014 Search and Query Service | CCI-SVC-002 Registry, CCI-SVC-021 Evidence Registry, CCI-SVC-020 Lineage, CCI-SVC-009 Trust Boundary, CCI-SVC-005 Audit Ledger | Required | Valid platform dependency | Pending CCI certification |
| CCI-SVC-015 Scheduler | CCI-SVC-002 Registry, CCI-SVC-003 Governance, CCI-SVC-017 Resource Manager, CCI-SVC-005 Audit Ledger, CCI-SVC-004 Replay | Required | Valid, architecture review required | Pending scheduler architecture |
| CCI-SVC-016 API Gateway and Registry | CCI-SVC-001 Identity, CCI-SVC-002 Registry, CCI-SVC-019 Validation, CCI-SVC-003 Governance, CCI-SVC-008 Observability | Required | Valid, gateway architecture required | Pending API architecture |
| CCI-SVC-017 Resource Manager | CCI-SVC-015 Scheduler, CCI-SVC-003 Governance, CCI-SVC-008 Observability, CCI-SVC-005 Audit Ledger | Required | Valid; scheduler dependency conditional until scheduler active | Conditional certification |
| CCI-SVC-018 Dependency Graph Service | CCI-SVC-002 Registry, CCI-SVC-019 Validation, CCI-SVC-020 Lineage, CCI-SVC-005 Audit Ledger | Required | Valid platform dependency | Pending CCI certification |
| CCI-SVC-019 Contract Validation Service | CCI-SVC-002 Registry, CCI-SVC-003 Governance, CCI-SVC-005 Audit Ledger | Required | Valid foundation dependency | Pending CCI certification |
| CCI-SVC-020 Lineage Service | CCI-SVC-001 Identity, CCI-SVC-002 Registry, CCI-SVC-005 Audit Ledger | Required | Valid foundation dependency | Pending CCI certification |
| CCI-SVC-021 Evidence Registry | CCI-SVC-001 Identity, CCI-SVC-006 Evidence Storage, CCI-SVC-020 Lineage, CCI-SVC-005 Audit Ledger, CCI-SVC-009 Trust Boundary | Required | Valid; storage dependency conditional until storage active | Conditional certification |
| CCI-SVC-022 Mission Control Visibility | CCI-SVC-008 Observability, CCI-SVC-014 Search and Query, CCI-SVC-003 Governance | Required application-to-platform dependency | Valid downward application dependency | Application certification |
| CCI-SVC-023 Recommendation Intelligence | CCI-SVC-003 Governance, CCI-SVC-004 Replay, CCI-SVC-021 Evidence Registry, CCI-SVC-014 Search and Query, CCI-SVC-005 Audit Ledger | Required application-to-platform dependency | Valid downward application dependency | Application certification |
| CCI-SVC-024 Mission Intelligence and Strategy | CCI-SVC-003 Governance, CCI-SVC-004 Replay, CCI-SVC-021 Evidence Registry, CCI-SVC-014 Search and Query, CCI-SVC-017 Resource Manager | Required application-to-platform dependency | Valid downward application dependency | Application certification |

## Canonical Platform Layer Allocation

| Capability or service | Layer | Rationale |
| --- | --- | --- |
| Constitutional governance authority | Constitutional | Defines rules that all platform services must obey. |
| Identity authority | Constitutional | Provides authoritative identity doctrine and namespace constraints. |
| Certification authority | Constitutional | Defines what counts as certification evidence and approval. |
| Evidence, lineage, replay doctrine | Constitutional | Defines immutable evidence, lineage, and replay requirements. |
| CCI-SVC-001 through CCI-SVC-021 | Platform | Reusable infrastructure services owned by CCI. |
| CCI-INF-001 through CCI-INF-021 | Framework | Reusable implementation frameworks that instantiate platform contracts. |
| CCI-EXT-001 through CCI-EXT-016 | Framework | Extension points expose governed framework contracts to programs. |
| CCI-SVC-022 through CCI-SVC-024 | Application | Mission Control application capabilities retained outside CCI. |
| Tenant configuration, tenant policy, tenant workflows, tenant preferences, tenant metadata, tenant operational state | Tenant | Tenant-specific state consumes application or approved platform contracts but never owns platform behavior. |

## Dependency Validation Engine

The Dependency Validation Engine validates every dependency record before activation.

Input contract:

| Field | Requirement |
| --- | --- |
| `dependency_id` | Stable identifier, `CCI-DEP-*`. |
| `provider_capability` | Provider service, framework, extension, application, or tenant capability. |
| `consumer_capability` | Consumer service, framework, application, or tenant capability. |
| `provider_layer` | One of `CONSTITUTIONAL`, `PLATFORM`, `FRAMEWORK`, `APPLICATION`, `TENANT`. |
| `consumer_layer` | One of `CONSTITUTIONAL`, `PLATFORM`, `FRAMEWORK`, `APPLICATION`, `TENANT`. |
| `dependency_type` | Constitutional, platform, framework, application, or tenant dependency. |
| `dependency_strength` | Required, conditional, optional, extension, or prohibited. |
| `provider_owner` | Canonical owner from VPR.4. |
| `consumer_owner` | Owning service or program. |
| `contract_ref` | CCI API, extension contract, or application contract reference. |
| `version_ref` | Version or compatibility policy reference. |
| `evidence_refs` | VPR and CCI lineage references. |
| `replay_policy` | Replay requirement and immutable input references. |
| `certification_status` | Certified, conditionally certified, pending, rejected. |

Validation output:

| Field | Meaning |
| --- | --- |
| `direction_result` | Pass, fail, or conditional pass for layer direction. |
| `ownership_result` | Pass when provider owner matches VPR.4 owner. |
| `cycle_result` | Pass when graph remains acyclic. |
| `lineage_result` | Pass when VPR lineage is complete. |
| `replay_result` | Pass when dependency can be reconstructed from immutable references. |
| `certification_result` | Pass, conditional, pending, or rejected. |
| `compatibility_result` | Pass when provider version satisfies consumer policy. |
| `violations` | Deterministic list of failed validation rules. |

## Dependency Lineage Registry

| Dependency ID | Consumer | Provider | Lineage | Contract | Lifecycle |
| --- | --- | --- | --- | --- | --- |
| CCI-DEP-001 | Identity Service | Registry Service | VPR4-OWN-001, VPR4-OWN-002, VPR3-SQL-001 | CCI-API-002 | DECLARED |
| CCI-DEP-002 | Identity Service | Audit Ledger Service | VPR4-OWN-001, VPR4-OWN-005 | CCI-API-005 | DECLARED |
| CCI-DEP-003 | Identity Service | Lineage Service | VPR4-OWN-001, VPR4-OWN-020 | CCI-API-020 | DECLARED |
| CCI-DEP-004 | Registry Service | Contract Validation Service | VPR4-OWN-002, VPR4-OWN-019, VPR-MRG-001 | CCI-API-019 | DECLARED |
| CCI-DEP-005 | Registry Service | Lineage Service | VPR4-OWN-002, VPR4-OWN-020 | CCI-API-020 | DECLARED |
| CCI-DEP-006 | Registry Service | Audit Ledger Service | VPR4-OWN-002, VPR4-OWN-005 | CCI-API-005 | DECLARED |
| CCI-DEP-007 | Governance Service | Trust Boundary Service | VPR4-OWN-003, VPR4-OWN-009, VPR-MRG-002 | CCI-API-009 | DECLARED |
| CCI-DEP-008 | Governance Service | Evidence Registry | VPR4-OWN-003, VPR4-OWN-021 | CCI-API-021 | DECLARED |
| CCI-DEP-009 | Governance Service | Contract Validation Service | VPR4-OWN-003, VPR4-OWN-019 | CCI-API-019 | DECLARED |
| CCI-DEP-010 | Governance Service | Replay Service | VPR4-OWN-003, VPR4-OWN-004 | CCI-API-004 | DECLARED |
| CCI-DEP-011 | Replay Service | Evidence Storage Service | VPR4-OWN-004, VPR4-OWN-006 | CCI-API-006 | UNDER_REVIEW |
| CCI-DEP-012 | Replay Service | Lineage Service | VPR4-OWN-004, VPR4-OWN-020 | CCI-API-020 | DECLARED |
| CCI-DEP-013 | Audit Ledger Service | Identity Service | VPR4-OWN-005, VPR4-OWN-001 | CCI-API-001 | DECLARED |
| CCI-DEP-014 | Workflow Engine | Governance Service | VPR4-OWN-013, VPR4-OWN-003, VPR-MRG-005 | CCI-API-003 | DECLARED |
| CCI-DEP-015 | Workflow Engine | Event Bus | VPR4-OWN-013, VPR4-OWN-007 | CCI-API-007 | UNDER_REVIEW |
| CCI-DEP-016 | Workflow Engine | Scheduler | VPR4-OWN-013, VPR4-OWN-015 | CCI-API-015 | UNDER_REVIEW |
| CCI-DEP-017 | Event Bus | Registry Service | VPR4-OWN-007, VPR4-OWN-002 | CCI-API-002 | UNDER_REVIEW |
| CCI-DEP-018 | Event Bus | Replay Service | VPR4-OWN-007, VPR4-OWN-004 | CCI-API-004 | UNDER_REVIEW |
| CCI-DEP-019 | Certification Service | Evidence Registry | VPR4-OWN-010, VPR4-OWN-021 | CCI-API-021 | DECLARED |
| CCI-DEP-020 | Certification Service | Replay Service | VPR4-OWN-010, VPR4-OWN-004 | CCI-API-004 | DECLARED |
| CCI-DEP-021 | Search and Query Service | Trust Boundary Service | VPR4-OWN-014, VPR4-OWN-009 | CCI-API-009 | DECLARED |
| CCI-DEP-022 | API Gateway and Registry | Identity Service | VPR4-OWN-016, VPR4-OWN-001 | CCI-API-001 | UNDER_REVIEW |
| CCI-DEP-023 | Resource Manager | Governance Service | VPR4-OWN-017, VPR4-OWN-003 | CCI-API-003 | DECLARED |
| CCI-DEP-024 | Mission Control Visibility | Observability Service | VPR4-OWN-022, VPR4-OWN-008 | CCI-API-008 | DECLARED |
| CCI-DEP-025 | Recommendation Intelligence | Governance Service | VPR4-OWN-023, VPR4-OWN-003 | CCI-API-003 | DECLARED |
| CCI-DEP-026 | Mission Intelligence and Strategy | Resource Manager | VPR4-OWN-024, VPR4-OWN-017 | CCI-API-017 | DECLARED |

## Dependency Replay Ledger

| Replay ID | Dependency set | Replay input | Expected replay result | Status |
| --- | --- | --- | --- | --- |
| VPR5-RPL-001 | Foundation dependencies | CCI-DEP-001 through CCI-DEP-006 | Identity, registry, validation, lineage, and audit dependencies replay without application references. | Replayable |
| VPR5-RPL-002 | Governance dependencies | CCI-DEP-007 through CCI-DEP-010 | Governance dependencies resolve to trust, evidence, validation, replay, and audit providers. | Replayable |
| VPR5-RPL-003 | Replay and audit dependencies | CCI-DEP-011 through CCI-DEP-013 | Replay dependencies are valid; storage dependency remains under review. | Conditional |
| VPR5-RPL-004 | Workflow dependencies | CCI-DEP-014 through CCI-DEP-016 | Workflow depends on governance and conditional event/scheduler services. | Conditional |
| VPR5-RPL-005 | Event dependencies | CCI-DEP-017 through CCI-DEP-018 | Event dependencies remain under review pending event bus architecture. | Conditional |
| VPR5-RPL-006 | Certification dependencies | CCI-DEP-019 through CCI-DEP-020 | Certification resolves evidence and replay providers. | Replayable |
| VPR5-RPL-007 | Access and application dependencies | CCI-DEP-021 through CCI-DEP-026 | Search, API, resource, and application dependencies flow downward and preserve ownership. | Conditional |

## Circular Dependency Review

Potential cycles detected at service level:

| Cycle candidate | Resolution |
| --- | --- |
| Identity -> Registry and Registry -> Identity | Allowed only through bootstrapped identity authority and registry entry references. CCI implementation must split root identity authority from registry-resolved identities. |
| Audit Ledger -> Identity and Identity -> Audit Ledger | Allowed only through append-only audit references after identity creation. Audit must accept root identity authority during bootstrap. |
| Governance -> Replay and Replay -> Validation/Governance policy | Replay depends on immutable governance policy snapshots, not live governance evaluation. |
| Workflow -> Event Bus -> Replay -> Storage and Workflow -> Replay | Valid acyclic runtime chain if event replay uses replay profiles and does not call workflow engine. |
| Resource Manager -> Scheduler and Scheduler -> Resource Manager | Must be split: Scheduler consumes capacity windows from Resource Manager; Resource Manager consumes scheduler availability as evidence only, not direct scheduler execution. |

Implementation rule: bootstrap services must define root contracts before runtime dependencies activate. Bootstrap contracts are constitutional records, not reverse platform dependencies.

## Architectural Dependency Report

| Check | Result | Notes |
| --- | --- | --- |
| Platform dependency architecture complete | Pass | Layer registry, dependency matrix, validation rules, lineage, and replay ledgers are defined. |
| Dependency direction deterministic | Pass | Direction rules and layer ordinal model are explicit. |
| Circular dependencies eliminated | Conditional pass | Cycle candidates are identified with required implementation splits. |
| Dependency lineage preserved | Pass | Dependency records trace to VPR.4 ownership and earlier VPR lineage. |
| Dependency replay validated | Conditional pass | Ready dependency sets are replayable; under-review services list blockers. |
| Architectural layers defined | Pass | Five-layer registry is canonical. |
| Platform Layer Registry operational | Baseline ready | Implementation can encode layer rules directly from this artifact. |
| Framework boundaries validated | Pass | Framework layer consumes platform services and exposes governed extension contracts. |
| Application boundaries validated | Pass | Mission Control application services depend downward on platform services only. |
| Tenant boundaries validated | Pass | Tenant layer cannot redefine platform behavior. |
| Constitutional hierarchy preserved | Pass | Constitutional layer has no lower-layer dependencies. |

## CCI Dependency Specification

CCI implementation must enforce:

- Static dependency declarations for every service, framework, extension, application, and tenant integration.
- Layer validation before service activation.
- Owner validation against VPR.4 ownership records.
- Contract validation against CCI API and extension references.
- Cycle detection during build, deployment, and certification.
- Replay evidence for every dependency graph.
- Certification evidence for every required, conditional, optional, and extension dependency.
- Supersession records for dependency changes.
- Rejection of prohibited reverse dependencies.

## Exit Criteria Assessment

| Exit criterion | Status |
| --- | --- |
| Platform dependency architecture complete | Satisfied. |
| Dependency direction deterministic | Satisfied through layer direction rules. |
| Circular dependencies eliminated | Satisfied at architecture level with implementation split requirements. |
| Dependency lineage preserved | Satisfied in Dependency Lineage Registry. |
| Dependency replay validated | Satisfied for ready sets; conditional blockers recorded. |
| Architectural layers defined | Satisfied in Platform Layer Registry. |
| Platform Layer Registry operational | Satisfied as implementation baseline. |
| Framework boundaries validated | Satisfied. |
| Application boundaries validated | Satisfied. |
| Tenant boundaries validated | Satisfied. |
| Constitutional hierarchy preserved | Satisfied. |
| CCI dependency architecture implementation-ready | Satisfied for baseline; under-review services retain activation blockers. |

VPR.5 is complete as a platform dependency architecture baseline. CCI implementation must encode the layer registry, dependency validation rules, replay ledger, and cycle review before activating platform services.
