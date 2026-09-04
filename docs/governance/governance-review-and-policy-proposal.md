# Governance Review and Policy-Proposal Boundary

- Phase: Phase 0, Part XVI
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

This boundary converts an observed quality signal into an evidence-backed proposal for authorized governance review. It does not implement policy changes.

```text
Quality report -> PROPOSED -> UNDER_REVIEW -> APPROVED_FOR_POLICY_CHANGE
                                             -> REJECTED / WITHDRAWN
```

## Rules

- A proposal requires report linkage, rationale, evidence, affected policy IDs, expected impact, provenance, and version references.
- Every reviewer action is checked through a separate `GovernanceReviewerAuthorizer`; proposal existence is not authority.
- Only `PROPOSED -> UNDER_REVIEW` and `UNDER_REVIEW -> APPROVED_FOR_POLICY_CHANGE | REJECTED | WITHDRAWN` are valid decisions.
- Approval only permits a future, separately authorized policy-change process. It does not amend a policy, the constitution, authority, or learned knowledge.

## Guardrail

```text
Metrics may prompt review.
Governance review may approve policy-change consideration.
Neither directly changes policy or constitutional authority.
```
