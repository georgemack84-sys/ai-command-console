# Phase 8ALT.2.1 - Recovery Contract

## Purpose

Phase 8ALT.2.1 establishes the immutable contractual foundation for Autonomous Recovery Intelligence. The contract standardizes recovery identity, lifecycle transitions, failure classification, recommendation structure, authority validation, operator approval, replay metadata, governance evidence, lineage, and integrity verification.

The contract is advisory-only. It does not authorize autonomous rollback, restart, execution, governance mutation, policy mutation, authority escalation, or cross-tenant recovery.

## Implementation

- `types/recovery-contract.ts` defines canonical recovery lifecycle states, failure categories, recovery categories, approval states, metadata schemas, validation results, replay results, and observability surfaces.
- `services/recovery-contract/index.ts` creates deterministic recovery records, validates lifecycle transitions, validates the contract, replays recovery records, builds operator observability, and exposes the canonical contract.
- `app/api/recovery-contract/*` exposes authenticated contract, recovery, validation, transition, recommendation, authority, approval, and replay routes.
- `tests/unit/recovery-contract/recoveryContract.test.ts` verifies schema completeness, deterministic identity, lifecycle enforcement, fail-closed scenarios, operator approval, replay determinism, tenant isolation, advisory-only behavior, and observability.

## Contract Guarantees

- Recovery identities are deterministic and immutable.
- Lifecycle transitions are restricted to the canonical state model.
- Failure and recovery classifications are standardized.
- Every recommendation contains root cause, expected outcome, ordered steps, confidence, risk, governance validation, constitutional validation, authority validation, replay linkage, lineage linkage, and integrity hash.
- Operator approval is mandatory before a recommendation can become ready.
- Replay metadata supports deterministic reconstruction.
- Governance, lineage, and integrity metadata are embedded in every record.
- Tenant isolation is enforced.
- The contract fails closed on missing identity, invalid classification, invalid lifecycle state, incomplete recommendation, authority failure, governance bypass, constitutional violation, missing approval, replay mismatch, lineage breakage, integrity failure, tenant isolation failure, autonomous execution, policy mutation, authority escalation, or hidden recovery logic.

## Verification

Run:

```bash
npx vitest run tests/unit/recovery-contract
npm run typecheck
```
