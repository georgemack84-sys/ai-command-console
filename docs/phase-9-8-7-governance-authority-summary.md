# Phase 9.8.7 - Governance, Constitutional & Authority Summary

## Preview

Phase 9.8.7 adds the operator-facing compliance summary layer for decision packages. It displays governance status, constitutional validation, authority requirements, approval obligations, restrictions, blockers, operator responsibilities, replay references, lineage references, and immutable compliance ledger records.

## Tightened Contract

This phase renders validated governance, constitutional, and authority outputs. It does not approve decisions, elevate authority, override governance, bypass constitutional validation, suppress restrictions, hide blockers, or execute actions.

The summary fails closed when governance status, constitutional status, authority requirements, approval requirements, restrictions, blockers, replay, lineage, integrity, tenant isolation, upstream presentation validity, upstream certification, or advisory-only behavior cannot be verified.

## Implementation

- `types/governance-authority-summary.ts` defines the governance authority summary, governance status, constitutional status, authority requirements, approval requirements, compliance report, validation, ledger, replay, observability, and foundation contracts.
- `services/governance-authority-summary/index.ts` implements deterministic rendering, validation, integrity hashing, immutable ledger creation, replay verification, observability, and the foundation export.
- `tests/unit/governance-authority-summary/governanceAuthoritySummary.test.ts` covers deterministic rendering, restrictions and blockers, fail-closed validation, tenant/advisory/security boundaries, invalid upstream inputs, replay divergence, and integrity tampering.

## Certification Notes

This phase is ready for Phase 9.8 certification when focused tests, 9.7/9.8 stack tests, broad decision sweeps, typecheck, and lint pass with only the repository's expected ignored-service-file warning.
