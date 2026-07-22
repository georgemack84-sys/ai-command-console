# Mission Control Phase 9.7.4 - Authority & Approval Requirement Resolver

## Preview

Phase 9.7.4 resolves whether a governance decision has explicit authority and approvals to continue through Mission Control governance. It validates authority assignments, mission scope, delegated authority, approval chains, escalation requirements, evidence, immutable ledger recording, and replay while remaining advisory-only.

## Tightened Contract

- Authority is verified, never assumed.
- Constitutional authority from Phase 9.7.3 is checked first; constitutional failures block authority resolution.
- Authority assignments are immutable, tenant and mission scoped, effective-date bounded, revocation-aware, and integrity protected.
- Approval chains must be explicit, ordered, replayable, and non-circular.
- Delegated authority must be explicit, bounded, scoped, and may not exceed the delegator.
- Missing approvals produce deterministic escalation outcomes such as `GOVERNANCE_REQUIRED` or `CERTIFICATION_REQUIRED`.
- The resolver never grants execution authority.

## Implementation

- Types: `types/authority-approval-requirement-resolver.ts`
- Service: `services/authority-approval-requirement-resolver/index.ts`
- Tests: `tests/unit/authority-approval-requirement-resolver/authorityApprovalRequirementResolver.test.ts`

## Certification Evidence

The service publishes `getAuthorityApprovalResolverFoundation()`, plus assignment creation, approval-chain creation, single-assignment evaluation, full resolution, replay, and observability APIs. Every resolution emits an Authority Evidence Report and immutable Authority Decision Ledger record.
