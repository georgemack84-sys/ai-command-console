# Phase 9.10.7 - Integrity Verification Engine

## Preview

The Integrity Verification Engine is the trust validation layer for Phase 9.10 replay. It recomputes deterministic hashes, validates lineage, checks cross-artifact consistency, detects tampering, and produces immutable verification records and reports.

## Tightened Contract

- The engine verifies evidence and never repairs or modifies it.
- Hash verification covers replay artifacts, snapshots, traces, packages, ledgers, audit records, and certification evidence.
- Lineage, snapshot consistency, ledger continuity, replay consistency, package consistency, and operator consistency are verified as separate domains.
- Outcomes are assigned deterministically as `VERIFIED`, `MODIFIED`, `CORRUPTED`, `MISSING`, or `FAIL_CLOSED`.
- Hash mismatches, broken lineage, replay/package/operator/snapshot/ledger inconsistency, missing or corrupted artifacts, unsupported algorithms, tenant violations, interruptions, and unknown outcomes block certification.
- Verification records and integrity reports are committed to append-only immutable ledgers.

## Implementation

- Types: `types/decision-integrity-verification-engine.ts`
- Service: `services/decision-integrity-verification-engine/index.ts`
- Tests: `tests/unit/decision-integrity-verification-engine/decisionIntegrityVerificationEngine.test.ts`

The service provides artifact loading, deterministic hash verification, lineage validation, consistency analysis, tamper detection, integrity reporting, and ledger writing for Phase 9.10 replay certification.
