# Phase 9.9.6 - Review Request Manager

## Preview

The Review Request Manager coordinates pre-decision review requests. It registers review requests, creates workflow dependencies, suspends workflow progression, tracks completion, resolves dependencies, resumes workflows, and preserves replayable review history.

## Tightened Contract

- Supported review types are `MORE_EVIDENCE`, `SIMULATION`, `GOVERNANCE_REVIEW`, `RECOVERY_PLAN`, and `CERTIFICATION_REVIEW`.
- Every review request creates exactly one deterministic dependency and suspension record before completion and resumption are evaluated.
- Workflow resumption is advisory-only and authorized only after the review is completed, dependency status is satisfied, constitutional validation passes, replay references exist, and lineage is complete.
- Governance and certification reviews require matching authority levels.
- Unknown review types, unauthorized requesters, invalid override context, failed dependency creation, failed suspension, incomplete reviews, governance/certification blockers, constitutional failure, replay gaps, lineage gaps, tenant mismatch, tampering, and non-advisory behavior fail closed.
- Review records, dependencies, suspension, completion, resumption, ledger, and replay outputs are append-only and integrity-protected.

## Implementation

- Types: `types/review-request-manager.ts`
- Service: `services/review-request-manager/index.ts`
- Tests: `tests/unit/review-request-manager/reviewRequestManager.test.ts`

The service integrates with Phase 9.9.5 Override Management and preserves the suspended workflow state until every review dependency is validated and resolved.
