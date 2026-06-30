# Phase 7I.1 Governance Integrity Contract

Phase 7I.1 defines the immutable integrity contract for Governance Intelligence artifacts. The implementation is intentionally object-level and governance-specific, while remaining linked to the Phase 7H replay certification chain.

## Contract Surface

- Type contract: `types/governance-integrity-contract.ts`
- Engine: `services/governance-integrity-contract/index.ts`
- API surface: `app/api/governance-integrity-contract/*`
- Unit coverage: `tests/unit/governance-integrity-contract/governanceIntegrityContract.test.ts`

## Protected Objects

The contract protects governance records, decisions, policies, compliance evaluations, risk assessments, recommendations, escalations, lineage records, replay records, Truth Ledger references, governance evidence, confidence assessments, and certification records.

The baseline 7I.1 record protects the Phase 7H.5 governance replay certification report. Its tenant, mission, replay references, evidence, certification reference, and previous hash are derived from the certified replay output so later 7I phases can build a hash chain over real governance artifacts.

## Required Sections

- `identity`: immutable record and protected object identity, tenant, mission, version, creator, and timestamp.
- `hash_information`: content hash, canonical hash, previous hash, algorithm, hash version, and timestamp.
- `lineage`: parent/root record identifiers, lineage path, depth, and supersession pointer.
- `replay_references`: replay id, replay hash, reconstruction hash, and Truth Ledger reference.
- `verification_metadata`: verification status, method, version, timestamp, and verifier.
- `integrity_state`: `VALID`, `DEGRADED`, or `CORRUPTED`.
- `evidence_references`: evidence, policy, compliance, recommendation, and risk references.
- `certification_metadata`: certification state, version, timestamp, and certification reference.

## Lifecycle

The deterministic lifecycle is:

`REGISTERED -> HASHED -> VERIFIED -> CERTIFIED -> MONITORED -> DEGRADED -> CORRUPTED -> RECOVERED -> MONITORED`

Illegal transitions are rejected by `transitionGovernanceIntegrityLifecycle`.

## Failure Classification

The validation engine fails closed:

- `MISSING_IDENTITY`, `INVALID_TENANT_SCOPE`, `HASH_MISMATCH`, `BROKEN_LINEAGE`, `REPLAY_MISMATCH`, `UNAUTHORIZED_FIELD_MODIFICATION`, `DUPLICATE_INTEGRITY_RECORD`, `ORPHAN_RECORD`, `LINEAGE_CYCLE`, and `HIDDEN_VERIFICATION_STATE` produce `CORRUPTED`.
- `UNSUPPORTED_HASH_ALGORITHM`, `MISSING_EVIDENCE_REFERENCE`, `VERIFICATION_METADATA_INCOMPLETE`, and `INVALID_CERTIFICATION_METADATA` produce `DEGRADED`.

Any `CORRUPTED` finding dominates `DEGRADED`; any finding blocks `VALID`.

## API

- `GET /api/governance-integrity-contract/contract`
- `POST /api/governance-integrity-contract/register`
- `POST /api/governance-integrity-contract/validate`
- `POST /api/governance-integrity-contract/hash`
- `POST /api/governance-integrity-contract/lifecycle`
- `POST /api/governance-integrity-contract/classify`
- `GET|POST /api/governance-integrity-contract/inspect`

All routes require workspace membership and return the standard API response envelope.

## Developer Notes

Use `buildGovernanceIntegrityContract()` for the baseline contract and `validateGovernanceIntegrityContract()` for fail-closed validation. Pass a `scenario` to generate deterministic negative fixtures, or pass a registry to detect duplicate protected-object records.
