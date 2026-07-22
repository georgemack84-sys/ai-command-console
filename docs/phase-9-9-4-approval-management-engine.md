# Phase 9.9.4 - Approval Management Engine

## Preview

The Approval Management Engine coordinates approval workflows after an operator action has been accepted. It discovers mandatory approvals, validates dependencies and approver authority, records immutable approval evidence, and authorizes workflow progression only when every required approval is complete.

## Tightened Contract

- Required approvals are deterministic: governance, supervisory, operator, and certification.
- Approval ordering is explicit: governance approval precedes supervisory approval, supervisory approval precedes operator approval, and operator approval precedes certification approval.
- Approval completion authorizes advisory workflow progression only. It does not execute actions, send notifications, route escalations, or perform autonomous work.
- Missing approvals, unauthorized approvers, incomplete dependencies, governance gaps, certification gaps, constitutional failures, replay gaps, lineage gaps, tenant mismatches, duplicate approvals, tampering, and invalid workflow/action states fail closed.
- Approval requests, dependencies, records, completion, ledger entries, and replay outputs are integrity-protected and deterministic.

## Implementation

- Types: `types/approval-management-engine.ts`
- Service: `services/approval-management-engine/index.ts`
- Tests: `tests/unit/approval-management-engine/approvalManagementEngine.test.ts`

The service integrates with Phase 9.9.3 Operator Action Engine and blocks workflow progression unless the action engine has accepted the operator action and all mandatory approvals are valid, complete, replayable, and advisory-only.
