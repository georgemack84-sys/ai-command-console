# Program 1 - Capability Discovery and Decomposition

Status: discovery and decomposition baseline

Program: Program 1 - Capability Atlas

Phase: P1.2 - Capability Discovery and Decomposition

Predecessors:

- [Program 1 - Capability Atlas Bootstrap Instantiation](./program-1-capability-atlas-bootstrap-instantiation.md)
- [Program 1 - Capability Registration Foundation](./program-1-capability-atlas-registration-foundation.md)

Successor:

- [Program 1 - Capability Identity](./program-1-capability-atlas-capability-identity.md)

## Purpose

P1.2 establishes the constitutional process for discovering, analyzing, and decomposing Civitas capabilities into atomic, reusable, implementation-independent candidate capabilities suitable for later identity assignment and registration.

This phase produces the authoritative inventory of capability candidates. It does not assign canonical Capability IDs, approve ownership, register capabilities, certify capabilities, or define implementation.

## Scope

P1.2 governs:

- Roadmap analysis.
- Capability discovery.
- Functional decomposition.
- Capability normalization.
- Capability granularity.
- Capability classification.
- Capability ownership candidates.
- Discovery evidence.
- Discovery lineage.
- Candidate readiness for identity and registration.

P1.2 does not govern:

- Canonical Capability ID assignment.
- Final ownership approval.
- Constitutional registration.
- Qualification or certification.
- Runtime implementation.

## Constitutional Principles

Principle registry ID: `P1.2-PRINCIPLE-REG-001`

| Principle | Rule |
| --- | --- |
| Capability First | Capabilities exist independently of systems, services, products, and implementations. |
| Atomic Responsibility | Every capability performs exactly one constitutional responsibility. |
| Implementation Independence | Capability definitions describe what is provided, not how it is implemented. |
| Discovery Before Registration | No capability may enter the Atlas until discovery and decomposition complete. |
| Deterministic Decomposition | Identical inputs shall produce identical decomposition outputs. |

## Constitutional Rules

Rule registry ID: `P1.2-RULE-REG-001`

- Each capability represents exactly one reusable responsibility.
- A capability shall never combine unrelated behavior.
- Each capability shall ultimately have one constitutional owner.
- Composite capabilities shall be decomposed before downstream identity assignment.
- Capability definitions shall support reuse whenever constitutionally applicable.
- Capability definitions shall not reference programming language, framework, infrastructure, deployment model, vendor, or runtime.
- Duplicate discoveries shall be preserved through linkage, normalization, supersession, and lineage.
- Discovery evidence shall be sufficient for independent verification and replay.

## Discovery Framework

Framework ID: `P1.2-DISC-FWK-001`

The Capability Discovery Framework provides deterministic discovery of reusable capabilities.

Components:

- Discovery Engine.
- Discovery Rules.
- Capability Extractor.
- Decomposition Engine.
- Classification Engine.
- Duplicate Detector.
- Discovery Validator.
- Discovery Evidence Generator.

Workflow:

```text
Roadmap
  -> Capability Identification
  -> Responsibility Analysis
  -> Atomic Decomposition
  -> Classification
  -> Duplicate Detection
  -> Candidate Registration
  -> Discovery Ledger
  -> Validation
  -> READY_FOR_IDENTITY
```

## Discovery Sources

Source registry ID: `P1.2-DISC-SOURCE-REG-001`

Capabilities shall be discovered from:

- Layer 0.
- Program roadmaps.
- Constitutional frameworks.
- Platform services.
- Governance services.
- Certification services.
- Operational services.
- Security services.
- Registry services.
- Identity services.
- Replay services.
- Audit services.
- Simulation services.
- Observability services.
- Workflow definitions.
- Existing implementations.
- Reusable infrastructure.
- Validated Platform Requirements.

Each source shall produce a source evidence reference and coverage record.

## Discovery Engine

Engine ID: `P1.2-DISC-ENG-001`

The Discovery Engine scans approved sources and emits candidate capability observations.

Responsibilities:

- Identify capability language in roadmap and architecture artifacts.
- Extract functional responsibilities.
- Identify possible reuse boundaries.
- Detect implicit governance, identity, registry, replay, audit, and certification responsibilities.
- Distinguish capability statements from implementation details.
- Emit candidate observations with source references.

Discovery outputs are provisional until validated.

## Capability Extractor

Extractor ID: `P1.2-CAP-EXT-001`

The Capability Extractor converts source observations into capability candidate drafts.

Draft fields:

- Candidate identifier.
- Source reference.
- Candidate name.
- Candidate description.
- Responsibility statement.
- Initial functional domain.
- Initial capability type.
- Initial reuse scope.
- Initial atomicity assessment.
- Implementation independence assessment.
- Evidence references.

Extractor rules:

- Use source language as evidence, not as final canonical naming.
- Remove implementation-specific phrasing.
- Separate action, object, authority, and evidence responsibilities.
- Flag ambiguous boundaries for decomposition.

## Responsibility Analysis

Analysis model ID: `P1.2-RESP-ANALYSIS-001`

Each candidate shall receive a responsibility analysis.

Analysis fields:

- Primary responsibility.
- Secondary responsibilities.
- Constitutional boundary.
- Governance boundary.
- Data boundary.
- Policy boundary.
- Evidence boundary.
- Reuse boundary.
- Certification boundary.
- Atomicity finding.

Atomic responsibility test:

- Can the responsibility be described in one stable sentence?
- Can it be owned independently?
- Can it be validated independently?
- Can it be reused independently?
- Can it be certified independently?
- Can it evolve independently without changing unrelated behavior?

Any negative answer requires decomposition review.

## Decomposition Framework

Framework ID: `P1.2-DECOMP-FWK-001`

Every composite capability shall undergo deterministic decomposition.

Decomposition workflow:

```text
Capability
  -> Responsibilities
  -> Functions
  -> Atomic Responsibilities
  -> Candidate Capabilities
  -> Validation
  -> Approved Atomic Candidate
```

Decomposition is required when a candidate:

- Performs multiple responsibilities.
- Owns multiple domains.
- Exposes unrelated interfaces.
- Contains multiple governance boundaries.
- Mixes infrastructure and business behavior.
- Cannot be independently reused.
- Cannot be independently certified.

## Decomposition Engine

Engine ID: `P1.2-DECOMP-ENG-001`

The Decomposition Engine transforms composite candidates into atomic candidates.

Engine outputs:

- Parent candidate reference.
- Decomposition rationale.
- Atomic candidate list.
- Boundary analysis.
- Responsibility split.
- Evidence references.
- Reviewer decision.
- Lineage references.

Decomposition constraints:

- Parent candidates are never deleted.
- Atomic candidates inherit source evidence from parent candidates.
- Atomic candidates receive independent responsibility statements.
- Decomposition shall preserve complete lineage.

## Classification Rules

Classification registry ID: `P1.2-CLASS-RULE-REG-001`

Every discovered candidate shall be classified using constitutional criteria.

Classification dimensions:

- Functional domain.
- Capability type.
- Reusability.
- Responsibility.
- Atomicity.
- Stability.

Classification shall be deterministic and evidence-bound.

## Functional Domain Catalog

Domain catalog ID: `P1.2-DOMAIN-CAT-001`

Initial functional domains:

- Identity.
- Registry.
- Governance.
- Policy.
- Certification.
- Replay.
- Audit.
- Security.
- Workflow.
- Simulation.
- Monitoring.
- Storage.
- Messaging.
- Analytics.
- Intelligence.
- Operations.

Additional domains require governed extension through Atlas vocabulary and semantic governance.

## Capability Type Catalog

Type catalog ID: `P1.2-CAP-TYPE-CAT-001`

Supported capability types:

- Constitutional.
- Platform.
- Framework.
- Shared Service.
- Infrastructure.
- Operational.
- Domain.
- Integration.
- Utility.

## Reuse Scope Catalog

Reuse catalog ID: `P1.2-REUSE-CAT-001`

Supported reuse scopes:

- Ecosystem.
- Program.
- Platform.
- Application.

Reuse scope records indicate intended reuse potential only. Final reuse approval occurs through later qualification and certification.

## Atomicity Catalog

Atomicity catalog ID: `P1.2-ATOMICITY-CAT-001`

Atomicity values:

- `ATOMIC`
- `COMPOSITE`
- `AMBIGUOUS`

Composite candidates shall enter decomposition.

Ambiguous candidates shall enter reviewer validation.

## Stability Catalog

Stability catalog ID: `P1.2-STABILITY-CAT-001`

Stability values:

- `STABLE`
- `EMERGING`
- `EXPERIMENTAL`

Stability classification does not block discovery. It informs readiness for downstream registration, qualification, and certification.

## Duplicate Detection

Detector ID: `P1.2-DUP-DETECT-001`

The Duplicate Detector identifies:

- Duplicate capabilities.
- Overlapping responsibilities.
- Synonymous capabilities.
- Alias capabilities.
- Redundant implementations.
- Competing ownership candidates.

Duplicate signals:

- Same responsibility statement.
- Same source function across multiple roadmaps.
- Equivalent domain and responsibility.
- Similar names with identical constitutional behavior.
- Same evidence lineage under different wording.
- Conflicting ownership candidates for the same responsibility.

## Duplicate Resolution

Resolution model ID: `P1.2-DUP-RES-001`

Duplicates are never deleted.

They shall be:

- Linked.
- Normalized.
- Superseded.
- Preserved through lineage.

Duplicate resolution outcomes:

- `UNIQUE`
- `DUPLICATE_LINKED`
- `NORMALIZED`
- `SUPERSESSION_RECOMMENDED`
- `OWNERSHIP_CONFLICT`
- `REQUIRES_REVIEW`

## Capability Candidate Registry

Registry ID: `P1.2-CAND-REG-001`

The Capability Candidate Registry maintains all discovered candidates prior to constitutional identity assignment and registration.

Candidate record fields:

- Candidate identifier.
- Discovery source.
- Capability name.
- Capability description.
- Responsibility statement.
- Functional domain.
- Capability type.
- Decomposition status.
- Duplicate status.
- Reuse scope.
- Ownership candidate.
- Discovery evidence.
- Lineage references.
- Validator status.
- Reviewer decisions.

Candidate identifiers are discovery-scoped and provisional. They are not canonical Capability IDs.

## Candidate Lifecycle

Lifecycle ID: `P1.2-CAND-LIFECYCLE-001`

```text
DISCOVERED
  -> ANALYZED
  -> DECOMPOSED
  -> CLASSIFIED
  -> VALIDATED
  -> READY_FOR_REGISTRATION
```

Lifecycle rules:

- `DISCOVERED` requires source evidence.
- `ANALYZED` requires responsibility analysis.
- `DECOMPOSED` requires atomicity validation or decomposition rationale.
- `CLASSIFIED` requires all classification dimensions.
- `VALIDATED` requires duplicate analysis and implementation independence validation.
- `READY_FOR_REGISTRATION` requires complete evidence and reviewer approval.

## Candidate Readiness

Readiness model ID: `P1.2-CAND-READY-001`

A candidate is ready for downstream identity and registration when:

- It has exactly one responsibility.
- It has an implementation-independent definition.
- It has a deterministic boundary.
- It has a unique or resolved responsibility.
- It has complete decomposition evidence.
- It has complete duplicate analysis.
- It has complete classification evidence.
- It has complete discovery lineage.
- It has reviewer approval.

## Discovery Ledger

Ledger ID: `P1.2-DISC-LEDGER-001`

The Capability Discovery Ledger provides immutable evidence of capability discovery.

Each discovery event records:

- Discovery identifier.
- Timestamp.
- Discovery source.
- Analyzer.
- Capability candidate.
- Decomposition evidence.
- Duplicate analysis.
- Normalization decisions.
- Reviewer.
- Validation outcome.
- Lineage references.
- Integrity hash.

Ledger rules:

- Ledger entries are append-only.
- Discovery history shall never be rewritten.
- Corrections create new entries.
- Candidate state shall be derived from ledger entries.
- Ledger replay shall reproduce discovery outcomes.

## Discovery Evidence

Evidence package ID: `P1.2-DISC-EVID-PKG-001`

Each discovered candidate shall include:

- Discovery source.
- Decomposition rationale.
- Responsibility analysis.
- Reuse justification.
- Duplicate assessment.
- Classification evidence.
- Validation results.
- Reviewer approval.
- Lineage references.
- Integrity hash.

Evidence shall be sufficient for independent verification and deterministic replay.

## Discovery Validator

Validator ID: `P1.2-DISC-VAL-001`

The Discovery Validator confirms candidate readiness.

Validation checks:

- Exactly one responsibility.
- Reusable definition.
- Implementation independence.
- Deterministic boundaries.
- Unique or resolved responsibility.
- Complete decomposition.
- Duplicate analysis complete.
- Discovery evidence complete.
- Lineage preserved.
- Reviewer decision recorded.

Validation outcomes:

- `VALIDATED`
- `REQUIRES_DECOMPOSITION`
- `REQUIRES_DUPLICATE_RESOLUTION`
- `REQUIRES_CLASSIFICATION`
- `REQUIRES_EVIDENCE`
- `REQUIRES_REVIEW`
- `REJECT_AS_NON_CAPABILITY`

## Discovery Replay Service

Replay service ID: `P1.2-DISC-RPL-SVC-001`

The Discovery Replay Service reconstructs discovery and decomposition outcomes using recorded evidence.

Replay inputs:

- Source artifacts.
- Discovery rules.
- Extractor version.
- Decomposition rules.
- Classification rules.
- Duplicate detection rules.
- Reviewer decisions.
- Discovery ledger entries.
- Evidence package.

Replay outputs:

- Reconstructed candidate list.
- Reconstructed decomposition outcomes.
- Reconstructed classifications.
- Reconstructed duplicate findings.
- Reconstructed validation outcomes.
- Replay hash.

Replay result values:

- `REPLAY_MATCH`
- `REPLAY_MISMATCH`
- `REPLAY_INCOMPLETE_EVIDENCE`
- `REPLAY_RULE_VERSION_MISSING`
- `REPLAY_REQUIRES_REVIEW`

## Success Metrics

Metrics registry ID: `P1.2-METRIC-REG-001`

The framework measures:

- Capabilities discovered.
- Roadmap coverage.
- Decomposition completeness.
- Duplicate detection rate.
- Normalization rate.
- Atomic capability percentage.
- Reusable capability percentage.
- Discovery replay consistency.
- Validation success rate.

Metrics are operational indicators and shall not override constitutional validation.

## Dependency Model

Dependency model ID: `P1.2-DEP-MODEL-001`

P1.2 depends on:

- P1.0 Atlas bootstrap namespace and schema.
- P1.1 registration foundation.

P1.2 enables:

- P1.3 Capability Identity.
- Capability ownership assignment.
- Capability dependency mapping.
- Capability registration.
- Capability certification.
- Atlas population.

## Validation Matrix

Validation matrix ID: `P1.2-DISC-VAL-MATRIX-001`

| Validation domain | Mechanism | Required result | Evidence |
| --- | --- | --- | --- |
| Source coverage | Discovery Engine | Roadmaps analyzed | Source coverage report |
| Responsibility analysis | Responsibility Analysis | One responsibility identified | Responsibility report |
| Atomicity | Decomposition Engine | Atomic or decomposed | Decomposition report |
| Classification | Classification Engine | All dimensions assigned | Classification report |
| Duplicate detection | Duplicate Detector | Duplicates identified and linked | Duplicate report |
| Implementation independence | Discovery Validator | No implementation-bound definitions | Validation report |
| Evidence completeness | Evidence Generator | Evidence package complete | Evidence manifest |
| Lineage preservation | Discovery Ledger | Lineage references recorded | Ledger proof |
| Replay reproducibility | Replay Service | Discovery replay matches | Replay report |

## Certification Matrix

Certification matrix ID: `P1.2-CERT-MATRIX-001`

| Criterion | Evidence source | Baseline status |
| --- | --- | --- |
| Discovery framework defined | `P1.2-DISC-FWK-001` | Satisfied |
| Discovery sources defined | `P1.2-DISC-SOURCE-REG-001` | Satisfied |
| Decomposition framework defined | `P1.2-DECOMP-FWK-001` | Satisfied |
| Classification rules defined | `P1.2-CLASS-RULE-REG-001` | Satisfied |
| Duplicate detection defined | `P1.2-DUP-DETECT-001` | Satisfied |
| Candidate registry defined | `P1.2-CAND-REG-001` | Satisfied |
| Discovery ledger defined | `P1.2-DISC-LEDGER-001` | Satisfied |
| Discovery evidence defined | `P1.2-DISC-EVID-PKG-001` | Satisfied |
| Replay service defined | `P1.2-DISC-RPL-SVC-001` | Satisfied |

## Exit Criteria Mapping

| Exit criterion | Satisfying artifact | Status |
| --- | --- | --- |
| All roadmap capabilities discovered | `P1.2-DISC-ENG-001` | Defined |
| Composite capabilities decomposed | `P1.2-DECOMP-ENG-001` | Defined |
| Atomic boundaries established | `P1.2-RESP-ANALYSIS-001` | Defined |
| Duplicate capabilities identified | `P1.2-DUP-DETECT-001` | Defined |
| Duplicate lineage preserved | `P1.2-DUP-RES-001` | Defined |
| Classifications complete | `P1.2-CLASS-RULE-REG-001` | Defined |
| Candidate registry populated | `P1.2-CAND-REG-001` | Defined |
| Discovery ledger operational | `P1.2-DISC-LEDGER-001` | Defined |
| Discovery evidence complete | `P1.2-DISC-EVID-PKG-001` | Defined |
| Discovery deterministic and replayable | `P1.2-DISC-RPL-SVC-001` | Defined |
| Candidates ready for registration | `P1.2-CAND-READY-001` | Defined |

## Certification Decision

Decision ID: `P1.2-CERT-DEC-001`

Baseline decision: `PASS`

Rationale:

- Capability discovery framework is defined.
- Atomic decomposition rules are established.
- Implementation independence is mandatory.
- Candidate registry and discovery ledger are defined.
- Duplicate detection preserves lineage.
- Discovery evidence and replay are mandatory.
- Downstream identity and registration readiness criteria are explicit.

Restrictions:

- P1.2 certifies candidate discovery and decomposition only.
- P1.2 does not assign canonical Capability IDs.
- P1.2 does not approve final ownership.
- P1.2 does not register, qualify, certify, or implement capabilities.

## Downstream Handoff

P1.2 hands off the following to P1.3 and later phases:

- Validated capability candidates.
- Responsibility statements.
- Classification records.
- Duplicate and normalization records.
- Ownership candidates.
- Discovery evidence.
- Discovery ledger entries.
- Lineage references.
- Replay references.

Downstream phases shall preserve discovery lineage and shall not reinterpret implementation-specific details as canonical capability identity.

## Summary

P1.2 establishes deterministic capability discovery and decomposition for the Capability Atlas.

It creates the framework, source registry, extractor, decomposition engine, classification rules, duplicate detector, candidate registry, discovery ledger, evidence package, replay service, validation matrix, and certification baseline required to prepare atomic capability candidates for permanent identity and constitutional registration.
