# Phase 10.8.7 - Evidence & Certification Validator

The Evidence & Certification Validator is the readiness assurance engine for the Governance-Aware Adaptation Layer. It verifies that every adaptive proposal has complete, trustworthy, traceable evidence and satisfies certification prerequisites before simulation, governance review, or implementation planning.

## Tightened Prompt

Validate every adaptive proposal for evidence completeness, evidence quality, evidence lineage, certification dependencies, documentation completeness, simulation prerequisites, rollback feasibility, replay readiness, audit readiness, trust validation, and certification readiness.

The validator must remain constitution-first, evidence-first, deterministic, explainable, replayable, evidence-backed, advisory-only, governance-enforced, fail-closed, tenant-isolated, immutable, audit-ready, lineage-preserving, and trust-verifiable. It does not decide whether an adaptation is desirable and does not authorize implementation. It only determines whether the proposal is sufficiently supported and certification-ready.

## Implemented Scope

- Typed validator contract in `types/evidence-certification-validator.ts`.
- Deterministic service in `services/evidence-certification-validator`.
- Required `EvidenceCertificationValidation` object with evidence completeness, quality score, lineage status, certification dependency status, documentation status, simulation prerequisite status, rollback feasibility status, certification readiness, reasoning, supporting evidence, dependency graph, replay reference, timestamp, and integrity hash.
- Evidence artifact inventory with source references, claim references, quality scores, lineage references, and integrity hashes.
- Evidence lineage graph covering source origins, collection history, transformation history, processing lineage, decision lineage, replay references, audit references, and integrity chain.
- Certification dependency graph for governance, constitutional, authority, tenant isolation, replay, audit, trust, security, and dependency certifications.
- Immutable evidence certification ledger entry for replay and audit.
- Authenticated APIs under `/api/evidence-certification-validator/*`.

## API Surface

- `GET /api/evidence-certification-validator/contract`
- `POST /api/evidence-certification-validator/validate`
- `POST /api/evidence-certification-validator/completeness`
- `POST /api/evidence-certification-validator/quality`
- `POST /api/evidence-certification-validator/lineage`
- `POST /api/evidence-certification-validator/dependencies`
- `POST /api/evidence-certification-validator/documentation`
- `POST /api/evidence-certification-validator/simulation-readiness`
- `POST /api/evidence-certification-validator/rollback`
- `POST /api/evidence-certification-validator/readiness`
- `POST /api/evidence-certification-validator/ledger`
- `POST /api/evidence-certification-validator/replay`
- `POST /api/evidence-certification-validator/inspect`

## Validation States

- `EVIDENCE_CERTIFIED`
- `READY_FOR_CERTIFICATION`
- `READY_FOR_SIMULATION`
- `DOCUMENTATION_REQUIRED`
- `CERTIFICATION_PENDING`
- `REQUIRES_OPERATOR_REVIEW`
- `RESTRICTED`
- `REJECTED`
- `FAIL_CLOSED`

## Fail-Closed Conditions

- Required evidence missing
- Evidence integrity verification failure
- Evidence quality below threshold
- Broken evidence lineage
- Unverified provenance
- Incomplete or invalid certification dependencies
- Missing or inconsistent documentation
- Unsatisfied simulation prerequisites
- Undemonstrated rollback feasibility
- Unverified replay readiness
- Incomplete audit readiness
- Failed trust validation
- Nondeterministic validation reasoning
- Replay divergence
- Integrity verification failure
- Validation decision recording failure
- Tenant isolation failure

## Certification Notes

- `READY_FOR_SIMULATION` is emitted only when evidence, lineage, certifications, documentation, simulation prerequisites, rollback, replay, audit, and trust checks are all satisfied.
- Hard-fail scenarios always return `FAIL_CLOSED`.
- The module is advisory and evidentiary; it does not grant authority or execute adaptation.
- Replay compares deterministic validation output and integrity hashes.
