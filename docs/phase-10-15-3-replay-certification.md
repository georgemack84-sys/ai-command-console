# Phase 10.15.3 - Replay Certification

## Purpose

Phase 10.15.3 certifies that every adaptive action can be reconstructed exclusively from immutable ledger evidence with identical inputs, reasoning, governance evaluations, constitutional decisions, simulations, outputs, and explanations.

## Implementation

- Added the `ReplayCertificationRecord` contract and typed replay certification models for input, evidence, reasoning, output, governance, constitutional, simulation, ledger, integrity, certification report, and reconstruction report domains.
- Added the deterministic `replay-certification/v10.15.3` service with replay reconstruction, equivalence scoring, ledger-only dependency enforcement, fail-closed certification validation, replay hashing, and integrity hashing.
- Added authenticated read-only API routes under `/api/replay-certification/*` for dashboard, contract, validation, inspection, certification record, each replay domain, and both reports.
- Added focused unit coverage for the full certification matrix plus all fail-closed failure conditions and tamper detection.

## Certification Rules

- Production readiness requires complete replay reconstruction, deterministic replay, cryptographic integrity, append-only ledger consistency, ledger-only reconstruction, and a replay equivalence score of exactly `1`.
- Hidden runtime state, omitted replay references, incomplete evidence lineage, replay nondeterminism, integrity mismatches, append-only violations, or any reconstruction divergence reject certification.
- Replay certification does not expose mutation, override, hidden-state, or production-advancement capabilities.

## Verification

- Focused unit coverage: `tests/unit/replay-certification/replayCertification.test.ts`
- Type safety: `npm run typecheck`
