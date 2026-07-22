# Phase 9.8.10 - Decision Package Ledger

## Preview

Phase 9.8.10 adds the authoritative immutable ledger for completed operator-facing decision packages. It stores package payloads, ledger records, replay registry entries, version history, deterministic indexes, validation results, audit reports, and immutable ledger entries.

## Tightened Contract

This phase stores and validates completed packages only. It does not generate packages, modify package contents, overwrite ledger records, delete committed entries, alter replay references, bypass governance, or authorize execution.

The ledger fails closed when the package is missing, schema is invalid, integrity verification fails, replay references are missing, lineage is incomplete, append-only rules are violated, version history is inconsistent, tenant isolation fails, upstream reference packages are invalid, or advisory-only behavior is violated.

## Implementation

- `types/decision-package-ledger.ts` defines ledger record, immutable storage, replay registry, version history, index, validation, audit report, immutable ledger entry, replay, observability, and foundation contracts.
- `services/decision-package-ledger/index.ts` implements deterministic immutable storage, replay registration, version history management, ledger indexing, validation, audit reporting, replay verification, observability, and the foundation export.
- `tests/unit/decision-package-ledger/decisionPackageLedger.test.ts` covers immutable commits, indexing, replay registration, version history, fail-closed validation, append-only enforcement, tenant/advisory/security boundaries, replay divergence, and integrity tampering.

## Certification Notes

This phase is ready for Phase 9.8 certification when focused tests, 9.7/9.8 stack tests, broad decision sweeps, typecheck, and lint pass with only the repository's expected ignored-service-file warning.
