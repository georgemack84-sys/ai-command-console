# Phase 7A.1 Governance Intelligence Contract

## Purpose

Phase 7A.1 defines the canonical Governance Intelligence record: a deterministic, tenant-scoped artifact that transforms evidence, policy, governance constraints, and context into an advisory governance-aware recommendation.

The contract is intentionally non-executing. It cannot override operators, bypass governance, mutate identity, drop evidence, or self-certify without validation.

## Contract Outputs

- `types/governance-intelligence.ts` defines the schema, allowed states, certification statuses, validation result model, and failure catalog.
- `services/governance-intelligence/index.ts` builds canonical records, publishes the doctrine, canonicalizes contract inputs, computes deterministic hashes, validates records, and blocks prohibited actions.
- `app/api/governance-intelligence/contract` returns the canonical default contract.
- `app/api/governance-intelligence/validate` validates a provided record or the canonical default.
- `app/api/governance-intelligence/hash` computes the deterministic contract hash.
- `tests/unit/governance-intelligence/governanceIntelligenceContract.test.ts` verifies positive, negative, tamper, replay, lineage, evidence, confidence, recommendation, and boundary behavior.

## Required Model

Every Governance Intelligence record must carry:

- Identity: `governance_intelligence_id`, `tenant_id`, `mission_id`.
- Timestamps: `created_timestamp`, `updated_timestamp`.
- Governance boundaries: `policy_scope`, `governance_scope`.
- Evidence and confidence requirements.
- Lineage and replay requirements.
- Recommendation requirements.
- State and certification fields.
- Evidence, policy, lineage, replay, recommendation, and escalation references.
- Metadata including schema version, source system, Truth Ledger baseline, and deterministic `contract_hash`.

## Doctrine

The contract enforces these principles:

- advisory-only
- evidence-bound
- policy-scoped
- tenant-isolated
- lineage-preserving
- replayable
- auditable
- certification-ready
- fail-closed

Allowed behavior is limited to analysis, correlation, advisory recommendation, escalation reference creation, lineage preservation, replay reference creation, and certification support.

## Validation

Validation is deterministic and fail-closed. Missing, ambiguous, corrupted, or unverifiable contract fields produce `FAIL` results with structured failure categories:

- `CONTRACT_VALIDATION`
- `GOVERNANCE_BOUNDARY`
- `EVIDENCE`
- `CONFIDENCE`
- `LINEAGE`
- `REPLAY`
- `RECOMMENDATION`
- `CERTIFICATION`
- `HASH_INTEGRITY`

The validator rejects missing identity, missing scopes, cross-tenant policy references, execution authority, missing operator supremacy, missing evidence, unsupported claims, missing confidence, low confidence, lineage breaks, replay mismatches, unsupported recommendations, policy conflicts without escalation, missing hashes, and hash mismatches.

## Hashing

Contract hashes are computed from a canonical serialization of the immutable contract inputs:

- identity
- tenant and mission binding
- policy scope
- governance scope
- evidence requirements
- confidence requirements
- lineage requirements
- replay requirements
- recommendation requirements

The metadata hash is excluded from the hash source so replay verification can recompute the same value from the contract body. Same contract inputs produce the same hash; changed contract inputs produce a changed hash; mismatches fail closed.

## Truth Ledger Relationship

Governance Intelligence records carry a Truth Ledger baseline reference from Phase 6M. That baseline anchors evidence, policy snapshots, lineage chains, replay artifacts, integrity hashes, decision history, and recommendation history to the completed Truth Ledger.

## Exit Criteria

7A.1 is complete when the schema, metadata, governance boundary model, evidence requirements, confidence requirements, lineage requirements, replay requirements, recommendation requirements, deterministic validator, contract hash, failure catalog, and test suite are present and passing.
