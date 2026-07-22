# Phase 9.8.8 - Operator Action & Approval Path Generator

## Preview

Phase 9.8.8 adds the operator-facing workflow presentation layer for decision packages. It renders available operator actions, approval paths, escalation workflows, certification requirements, action summaries, validation results, replay references, lineage references, and immutable workflow ledger records.

## Tightened Contract

This phase generates guidance only. It does not execute operator actions, approve decisions, perform certification, orchestrate workflows, elevate authority, bypass governance, bypass constitutional controls, or modify recommendations.

The engine fails closed when operator actions, approval paths, escalation workflow, certification requirements, authority validation, governance validation, replay, lineage, integrity, tenant isolation, upstream compliance summary validity, or advisory-only behavior cannot be verified.

## Implementation

- `types/operator-action-approval-path.ts` defines the workflow, action, approval path, escalation workflow, certification requirements, action summary, validation, ledger, replay, observability, and foundation contracts.
- `services/operator-action-approval-path/index.ts` implements deterministic action availability rules, approval path generation, escalation and certification records, validation, integrity hashing, immutable ledger creation, replay verification, observability, and the foundation export.
- `tests/unit/operator-action-approval-path/operatorActionApprovalPath.test.ts` covers deterministic workflows, action availability, approval/escalation/certification records, fail-closed validation, unauthorized action exposure, tenant/advisory/security boundaries, replay divergence, and integrity tampering.

## Certification Notes

This phase is ready for Phase 9.8 certification when focused tests, 9.7/9.8 stack tests, broad decision sweeps, typecheck, and lint pass with only the repository's expected ignored-service-file warning.
