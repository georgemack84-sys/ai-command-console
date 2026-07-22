# Program 2 - Registry, Metadata and Discovery

Status: registry, metadata and discovery baseline

Program: Program 2 - Civitas Core Infrastructure

Phase: P2.4 - Registry, Metadata and Discovery

Predecessors:

- [Program 2 - Program Foundation and Constitutional Authority Binding](./program-2-cci-program-foundation-constitutional-authority-binding.md)
- [Program 2 - Validated Platform Requirements and Capability Promotion](./program-2-cci-validated-platform-requirements-capability-promotion.md)
- [Program 2 - Platform Contract Architecture](./program-2-cci-platform-contract-architecture.md)
- [Program 2 - Identity and Principal Infrastructure](./program-2-cci-identity-principal-infrastructure.md)
- [Program 1 - Capability Atlas Certification Gate](./program-1-capability-atlas-certification-gate.md)

## Purpose

P2.4 establishes the canonical registry infrastructure for the Civitas ecosystem.

This phase creates platform-wide services responsible for discovering, identifying, cataloging, versioning, and governing every shared infrastructure artifact. It provides deterministic discovery and metadata management while preserving constitutional lineage and replay.

P2.4 is the authoritative owner of platform registries and discovery services. Programs may publish to these registries but shall never redefine registry semantics or implement competing registry infrastructures.

## Scope

Scope ID: `P2.4-REG-SCOPE-001`

P2.4 owns:

- Registry Infrastructure.
- Metadata Services.
- Service Discovery.
- Version Catalogs.
- Schema Registry.
- Platform Catalogs.
- Artifact Catalogs.
- Registry APIs.
- Metadata Standards.
- Discovery Contracts.
- Registry Governance.
- Registry Lineage.
- Registry Certification.

P2.4 does not define:

- Identity semantics, which are owned by P2.3.
- Platform contracts, which are owned by P2.2.
- Governance policy, which is owned by Layer 0.
- Certification rules, which are owned by Layer 0.
- Capability definitions, which are owned by Program 1.
- Implementation logic of registered services.

## Constitutional Authority

Authority ID: `P2.4-AUTH-INH-001`

P2.4 inherits authority from:

- Layer 0 constitutional governance.
- Program 1 Capability Atlas.
- P2.0 authority binding.
- P2.1 promotion lineage.
- P2.2 platform contract architecture.
- P2.3 identity and principal infrastructure.

P2.4 provides registry and discovery infrastructure without redefining upstream semantics.

## Constitutional Responsibilities

Responsibility registry ID: `P2.4-RESP-REG-001`

P2.4 shall:

- Provide deterministic registry behavior.
- Maintain immutable metadata.
- Preserve historical lineage.
- Govern artifact discovery.
- Expose deterministic lookup APIs.
- Support constitutional replay.
- Maintain version catalogs.
- Provide schema governance.
- Support ecosystem-wide discoverability.

## Registry Domains

Domain registry ID: `P2.4-REG-DOMAIN-REG-001`

Platform Registry:

- Registers every platform service.
- Examples include Identity Service, Registry Service, Audit Service, Policy Service, and Event Service.

Schema Registry:

- Stores schemas, schema versions, compatibility rules, and supersession history.

Metadata Registry:

- Stores ownership, classifications, dependencies, lifecycle state, labels, tags, and operational metadata.

Version Catalog:

- Stores service versions, schema versions, compatibility, migration history, and release lineage.

Service Discovery Registry:

- Supports service lookup, endpoint discovery, interface discovery, contract discovery, and dependency discovery.

Artifact Registry:

- Stores specifications, contracts, APIs, reference implementations, documentation, and certification artifacts.

## Registry Foundation

Foundation ID: `P2.4-REG-FOUNDATION-001`

The Registry Foundation defines the constitutional registry model.

Produces:

- Registry Contract.
- Registry Types.
- Registry Ownership Model.
- Registry Naming Standards.
- Registry Namespace Rules.

Foundation requirements:

- Registry architecture shall be approved before implementation.
- Registry ownership shall be deterministic.
- Namespace governance shall be complete.
- Registry semantics shall not be redefined by consumers.

## Registry Contract

Contract ID: `P2.4-REG-CONTRACT-001`

The Registry Contract defines the canonical agreement for platform registries.

Contract fields:

- Registry ID.
- Registry type.
- Registry owner.
- Namespace.
- Supported artifact classes.
- Required metadata.
- Lifecycle model.
- API surface.
- Governance obligations.
- Evidence obligations.
- Replay obligations.
- Certification requirements.

## Registry Ownership Model

Ownership model ID: `P2.4-REG-OWN-MODEL-001`

Every registry shall have exactly one constitutional owner.

Ownership defines:

- Registry stewardship.
- Metadata authority.
- Schema authority.
- Lifecycle authority.
- API authority.
- Evidence ownership.
- Certification responsibility.

Ownership changes produce additive lineage.

## Registry Metadata Framework

Framework ID: `P2.4-META-FWK-001`

The Registry Metadata Framework standardizes metadata.

Metadata categories:

- Identity.
- Ownership.
- Lifecycle.
- Governance.
- Version.
- Dependency.
- Classification.
- Certification.
- Security.
- Observability.

Metadata types:

- Required metadata.
- Optional metadata.
- Ownership metadata.
- Dependency metadata.
- Operational metadata.
- Governance metadata.

Metadata shall be deterministic, validated, lineage-preserving, and replayable.

## Metadata Registry

Registry ID: `P2.4-META-REG-001`

The Metadata Registry stores governed metadata records.

Metadata record fields:

- Metadata ID.
- Subject artifact ID.
- Metadata category.
- Metadata schema.
- Metadata value reference.
- Owner.
- Version.
- Lifecycle state.
- Evidence references.
- Lineage references.
- Replay references.
- Integrity hash.

Metadata history is append-only.

## Metadata Management

Service ID: `P2.4-META-MGMT-SVC-001`

Metadata Management governs metadata lifecycle.

Capabilities:

- Metadata validation.
- Metadata inheritance.
- Metadata enrichment.
- Metadata lineage.
- Metadata replay.
- Metadata auditing.

Metadata mutations shall preserve immutable history.

## Platform Registry Service

Service ID: `P2.4-PLATFORM-REG-SVC-001`

The Platform Registry Service registers every platform service.

Responsibilities:

- Register services.
- Validate ownership.
- Validate namespace.
- Bind platform contracts.
- Bind capability references.
- Track lifecycle.
- Track versions.
- Record evidence.
- Support deterministic lookup.

## Registry API

API ID: `P2.4-REG-API-001`

Registry operations:

- Register.
- Lookup.
- Search.
- Query.
- Enumerate.
- Version.
- Deprecate.
- Supersede.
- Validate.
- Audit.
- Replay.

API requirements:

- APIs conform to P2.2 interface standards.
- API responses are deterministic.
- Mutating APIs require authenticated principals from P2.3.
- Replay is supported for registry decisions.

## Service Discovery Framework

Framework ID: `P2.4-SVC-DISC-FWK-001`

Service Discovery provides deterministic discovery.

Supports:

- Service lookup.
- Contract lookup.
- Dependency lookup.
- Endpoint discovery.
- Implementation discovery.
- Version discovery.
- Capability discovery.

Discovery rules:

- Discovery never guesses.
- Discovery always returns deterministic results.
- Unknown services produce deterministic failure.
- Discovery results reference authoritative registry records.

## Service Catalog

Catalog ID: `P2.4-SVC-CATALOG-001`

The Service Catalog records discoverable CCI services.

Catalog fields:

- Service ID.
- Service name.
- Platform contract reference.
- Capability references.
- Owner.
- Namespace.
- Lifecycle state.
- Version.
- Interface references.
- Endpoint references.
- Dependency references.
- Evidence references.

## Schema Registry

Registry ID: `P2.4-SCHEMA-REG-001`

The Schema Registry governs shared schemas.

Stores:

- Schema definitions.
- Schema history.
- Compatibility.
- Migration.
- Validation rules.
- Schema lineage.
- Schema supersession.
- Schema inheritance.

Schema registry requirements:

- Schema compatibility shall be deterministic.
- Historical schema records are immutable.
- Schema changes produce lineage.
- Schema validation produces evidence.

## Version Catalog

Catalog ID: `P2.4-VERSION-CATALOG-001`

The Version Catalog governs platform version history.

Catalogs:

- Service versions.
- Schema versions.
- Contract versions.
- Artifact versions.

Supports:

- Compatibility lookup.
- Migration planning.
- Rollback planning.
- Replay reconstruction.

Version lineage shall be reproducible.

## Platform Artifact Catalog

Catalog ID: `P2.4-ARTIFACT-CATALOG-001`

The Platform Artifact Catalog stores:

- Specifications.
- Contracts.
- APIs.
- Reference implementations.
- Documentation.
- Certification artifacts.
- Architecture decisions.
- Validation reports.

Artifact discovery shall be deterministic and evidence-backed.

## Registry Lineage Graph

Graph ID: `P2.4-REG-LIN-GRAPH-001`

The Registry Lineage Graph maintains immutable historical relationships.

Tracks:

- Creation.
- Modification.
- Ownership changes.
- Version evolution.
- Schema evolution.
- Supersession.
- Retirement.

Lineage rules:

- History is append-only.
- History is never rewritten.
- Lineage is reproducible.

## Registry Event Ledger

Ledger ID: `P2.4-REG-EVT-LEDGER-001`

The Registry Event Ledger records:

- Registry creation.
- Registration events.
- Metadata changes.
- API mutations.
- Discovery publication.
- Schema changes.
- Version changes.
- Ownership changes.
- Supersession.
- Retirement.
- Replay validation.

Ledger entries are immutable and ordered.

## Discovery API

API ID: `P2.4-DISC-API-001`

Discovery API supports:

- Identity Discovery.
- Service Discovery.
- Registry Discovery.
- Schema Discovery.
- Version Discovery.
- Dependency Discovery.
- Capability Discovery.
- Artifact Discovery.

Discovery API requirements:

- Results are deterministic.
- Unknown records fail deterministically.
- Results include evidence references.
- Results preserve access policy.
- Results expose lineage references when available.

## Registry Governance

Governance ID: `P2.4-REG-GOV-001`

Registry Governance validates:

- Ownership.
- Metadata.
- Schemas.
- Version compatibility.
- Namespace uniqueness.
- Dependency integrity.

Produces:

- Registry Validation Reports.
- Registry Integrity Ledger entries.
- Registry Governance Decisions.

Governance behavior inherits Layer 0 and does not redefine policy.

## Registry Validation Framework

Framework ID: `P2.4-REG-VAL-FWK-001`

The Registry Validation Framework validates:

- Registry contract compliance.
- Ownership uniqueness.
- Namespace governance.
- API conformance.
- Metadata completeness.
- Metadata lineage.
- Service discovery determinism.
- Unknown service handling.
- Schema registry operation.
- Schema compatibility.
- Version catalog completeness.
- Artifact catalog completeness.
- Dependency discovery reproducibility.
- Registry integrity.
- Replay reproducibility.
- Cross-registry consistency.

Validation outcomes:

- `VALID`
- `REGISTRY_CONTRACT_INVALID`
- `OWNERSHIP_AMBIGUOUS`
- `NAMESPACE_CONFLICT`
- `API_NONCOMPLIANT`
- `METADATA_INCOMPLETE`
- `METADATA_LINEAGE_BROKEN`
- `DISCOVERY_NONDETERMINISTIC`
- `SCHEMA_COMPATIBILITY_UNKNOWN`
- `VERSION_CONFLICT`
- `ARTIFACT_MISSING`
- `DEPENDENCY_DISCOVERY_FAILED`
- `REPLAY_FAILED`
- `CROSS_REGISTRY_INCONSISTENT`
- `FAIL_CLOSED`

## Registry Observability

Dashboard ID: `P2.4-REG-OBS-DASH-001`

Registry observability monitors:

- Registry availability.
- Lookup latency.
- Metadata validation failures.
- Schema validation failures.
- Version conflicts.
- Namespace conflicts.
- Discovery failures.
- Integrity violations.

Produces:

- Registry Health Dashboard.
- Registry Metrics.
- Operational Alerts.

Observability does not mutate registry state.

## Registry Replay Service

Replay service ID: `P2.4-REG-RPL-SVC-001`

The Registry Replay Service reconstructs registry state, metadata history, discovery responses, schema compatibility, version lineage, artifact catalog state, registry governance decisions, and certification evidence.

Replay outcomes:

- `REPLAY_MATCH`
- `REPLAY_MISMATCH`
- `REPLAY_INCOMPLETE_EVIDENCE`
- `REPLAY_SCHEMA_VERSION_MISSING`
- `REPLAY_METADATA_LINEAGE_MISSING`
- `REPLAY_CROSS_REGISTRY_INCONSISTENCY`
- `REPLAY_REQUIRES_GOVERNANCE_REVIEW`

## Registry Certification Package

Package ID: `P2.4-REG-CERT-PKG-001`

The Registry Certification Package contains:

- Registry contract validation.
- Ownership validation.
- Namespace validation.
- API conformance report.
- Metadata model validation.
- Metadata lineage report.
- Service discovery validation.
- Schema registry certification.
- Version catalog validation.
- Artifact catalog validation.
- Dependency discovery validation.
- Integrity validation.
- Replay report.
- Historical lineage report.
- Constitutional inheritance validation.
- Program 1 capability reference validation.
- Audit evidence.
- Observability validation.
- Cross-registry consistency validation.

## Constitutional Rules

Rule registry ID: `P2.4-CONST-RULE-REG-001`

- P2.4 is the authoritative owner of platform registry and discovery infrastructure.
- Programs may publish to registries but shall not redefine registry semantics.
- Registry behavior shall be deterministic.
- Registry metadata shall be immutable through append-only lineage.
- Historical registry records shall never be rewritten.
- Discovery shall never guess.
- Unknown services shall produce deterministic failure.
- Registry APIs shall conform to platform contracts.
- Mutating registry operations require authenticated principals.
- Schema compatibility shall be governed and reproducible.
- Version lineage shall be reproducible.
- Registry governance inherits Layer 0 policy and certification rules.
- Program 1 capability references shall be preserved.
- Registry replay shall reconstruct equivalent registry outcomes.

## Certification Test Matrix

Test matrix ID: `P2.4-CERT-TEST-MATRIX-001`

| Test | Expected |
| --- | --- |
| Registry contract approved | PASS |
| Registry ownership unique | PASS |
| Namespace governance deterministic | PASS |
| Registry APIs conform to platform contracts | PASS |
| Metadata model complete | PASS |
| Required metadata enforced | PASS |
| Metadata lineage immutable | PASS |
| Service discovery deterministic | PASS |
| Unknown service handling deterministic | PASS |
| Schema registry operational | PASS |
| Schema compatibility validation operational | PASS |
| Version catalog complete | PASS |
| Version lineage reproducible | PASS |
| Artifact catalog complete | PASS |
| Dependency discovery reproducible | PASS |
| Registry integrity validated | PASS |
| Registry replay reproducible | PASS |
| Historical lineage preserved | PASS |
| Constitutional inheritance validated | PASS |
| Layer 0 governance compatibility verified | PASS |
| Program 1 capability references preserved | PASS |
| Registry audit evidence complete | PASS |
| Registry observability operational | PASS |
| Cross-registry consistency validated | PASS |
| Certification evidence complete | PASS |

## Certification Decision

Decision ID: `P2.4-CERT-DEC-001`

Baseline decision: `PASS`

Rationale:

- Registry infrastructure, metadata framework, registry APIs, service discovery, schema registry, version catalog, artifact catalog, lineage graph, event ledger, governance, validation, observability, replay, and certification package are defined.
- P2.4 owns registry and discovery infrastructure without redefining identity, platform contract, governance, certification, or capability semantics.
- Registry behavior, metadata, discovery, version lineage, and replay are deterministic and evidence-backed.

Restrictions:

- P2.4 does not define identity semantics.
- P2.4 does not define platform contracts.
- P2.4 does not define Layer 0 governance policy or certification rules.
- P2.4 does not define Program 1 capabilities.
- P2.4 does not implement registered service logic.

## Exit Criteria Mapping

| Exit criterion | Satisfying artifact | Status |
| --- | --- | --- |
| Registry infrastructure operational | `P2.4-PLATFORM-REG-SVC-001` | Defined |
| Metadata framework standardized | `P2.4-META-FWK-001` | Defined |
| Service discovery deterministic | `P2.4-SVC-DISC-FWK-001` | Defined |
| Schema registry certified | `P2.4-SCHEMA-REG-001` | Defined |
| Version catalog complete | `P2.4-VERSION-CATALOG-001` | Defined |
| Registry governance operational | `P2.4-REG-GOV-001` | Defined |
| Namespace ownership deterministic | `P2.4-REG-OWN-MODEL-001` | Defined |
| Artifact discovery reproducible | `P2.4-ARTIFACT-CATALOG-001` | Defined |
| Historical lineage immutable | `P2.4-REG-LIN-GRAPH-001` | Defined |
| Replay reconstruction validated | `P2.4-REG-RPL-SVC-001` | Defined |
| Constitutional inheritance verified | `P2.4-AUTH-INH-001` | Defined |
| Registry certification passed | `P2.4-CERT-DEC-001` | Defined |

## Summary

P2.4 establishes the Registry, Metadata and Discovery infrastructure for Civitas Core Infrastructure.

It defines authoritative registry services, metadata standards, deterministic discovery, schema and version catalogs, artifact cataloging, APIs, lineage, event ledger, governance validation, observability, replay, and certification while preserving upstream ownership of identity, contracts, governance, certification, and capability definitions.
