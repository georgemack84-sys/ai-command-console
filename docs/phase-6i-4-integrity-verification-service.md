# Mission Control Phase 6I.4 - Integrity Verification Service

Phase 6I.4 creates the callable service layer for integrity verification. It orchestrates the lower-level integrity stack:

- 6I.1 Integrity Contract
- 6I.2 Hash Chain Engine
- 6I.3 Tamper Detection

The service answers whether records, chains, replay bundles, evidence bundles, lineage graphs, governance scopes, archive packages, mission ledgers, tenant ledgers, and certification scopes are still valid and certifiable.

## Service Surface

`verifyTruthIntegrity` accepts a formal `TruthIntegrityVerificationRequest` and protected records, then returns a deterministic `TruthIntegrityVerificationResult` containing:

- verification and certification state
- verified, failed, and unverifiable record IDs
- check results for schema, identity, hash, chain, tamper, lineage, replay, evidence, governance, tenant boundary, archive, and index integrity
- tamper finding refs and affected refs
- escalation and operator review flags
- certification blocked flag
- rationale
- deterministic `result_hash`
- append-only and no-source-mutation guard flags

## Classification

Verification states map to certification decisions:

- `VERIFIED` -> `CERTIFIABLE`
- `PARTIALLY_VERIFIED` -> `CONDITIONAL_CERTIFICATION`
- `DEGRADED` -> `CONDITIONAL_CERTIFICATION`
- `FAILED` -> `NOT_CERTIFIABLE`
- `INCOMPLETE` -> `CERTIFICATION_BLOCKED`
- `UNVERIFIABLE` -> `CERTIFICATION_BLOCKED`
- `INVALID` -> `CERTIFICATION_BLOCKED`

## Guardrails

The service:

- validates request contracts
- checks tenant boundaries before certification
- recomputes canonical hashes
- checks chain continuity, sequence, missing, inserted, and duplicate records
- integrates tamper detection
- validates evidence, lineage, replay, governance, archive, and index consistency
- records results append-only
- never repairs, rewrites, mutates, suppresses findings, grants authority, or auto-certifies failed records

## Adapters

The implementation exposes:

- `verifyTruthIntegrity`
- `toTruthIntegrityVerificationLedgerRecord`
- `toTruthIntegrityOperatorVisibilityReport`

These provide the service result, append-only ledger storage shape, and operator visibility summary needed by future certification gates and observability surfaces.

## Certification Coverage

The focused test suite covers:

- valid and invalid requests
- tenant boundary failure
- schema and identity validation
- hash validation
- chain continuity and chain break
- tamper detection integration
- record deletion, insertion, reordering, and duplicates
- lineage, evidence, replay, governance, archive, and index validation
- degraded index behavior
- fail-closed unverifiable behavior
- append-only result records
- operator visibility report
- certification decision mapping
- deterministic verification result hashes
