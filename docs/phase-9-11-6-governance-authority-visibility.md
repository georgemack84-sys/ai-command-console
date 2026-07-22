# Phase 9.11.6 - Governance & Authority Visibility

## Preview

Phase 9.11.6 adds the read-only visibility layer for governance enforcement, constitutional compliance, authority validation, approval workflows, operational restrictions, and governance evidence. It consumes the Phase 9.11.5 priority and risk dashboard, then renders deterministic views for governance operators, auditors, and mission consoles.

## Tightened Contract

The implementation exposes:

- `GovernanceDashboard` for governance state, policy results, compliance summary, reviews, escalations, replay references, and certification references.
- `ConstitutionalDashboard` for constitutional state, rules, violations, operator requirements, governance requirements, and replay evidence.
- `AuthorityDashboard` for authority level, assigned authority, delegation chain, approval requirements, authority conflicts, and replay evidence.
- `ApprovalWorkflow` for approval stage, chain, pending/completed/rejected approvals, delegations, expirations, escalations, and replay evidence.
- `RestrictionView` for governance, constitutional, authority, certification, replay, evidence, and dependency restrictions.
- `GovernanceVisibilityLedgerEntry` for append-only governance events with sequence numbers, replay refs, certification refs, and integrity hashes.
- `GovernanceVisibilityRecord` as the deterministic join record for every rendered view.

All rendered objects are immutable, hash-protected, replayable, tenant-isolated, and advisory-only. The service never mutates governance state, assigns authority, approves work, or grants execution authority.

## Fail-Closed Validation

The validation layer blocks visibility certification when:

- governance status is hidden
- constitutional violations are omitted
- authority assignments are inaccurate
- approval workflows are incomplete
- operational restrictions are hidden
- governance lineage is inconsistent
- replay references are missing
- certification dependencies are absent
- rendering becomes nondeterministic
- cross-tenant governance data is exposed
- integrity hashes fail validation
- replay reconstruction fails
- the requesting role lacks dashboard visibility
- execution authority is granted by the visibility layer

## Implementation

- Types: `types/decision-governance-authority-visibility.ts`
- Service: `services/decision-governance-authority-visibility/index.ts`
- Tests: `tests/unit/decision-governance-authority-visibility/decisionGovernanceAuthorityVisibility.test.ts`

Primary API:

- `runGovernanceAuthorityVisibility(input?)`
- `replayGovernanceAuthorityVisibility(result)`
- `computeGovernanceStatusRecordHash(record)`
- `getGovernanceAuthorityVisibilityFoundation()`
- `GovernanceAuthorityVisibility.run(...)`
- `GovernanceAuthorityVisibility.replay(...)`
