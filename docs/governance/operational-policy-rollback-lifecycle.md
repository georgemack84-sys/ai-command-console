# Operational Policy Rollback Lifecycle

- Phase: Phase 0, Part XVIII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Rollback reactivates an existing, eligible prior operational-policy version. It preserves every policy version and activation record.

```text
Active version 2.0.0 + rollback authorization
  -> reactivate existing version 1.0.0
  -> OPERATIONAL_POLICY_ROLLED_BACK audit event
```

## Rules

- Rollback requires a non-empty reason, an active operational policy, a target with the same policy ID and scope, and a target activated before the current version.
- A separate `PolicyRollbackAuthorizer` is required; activation authority is not implicitly reusable.
- The target already being active is an idempotent replay. Missing, equal-or-newer, or cross-scope targets are rejected.
- The Learning Constitution is never rollback-eligible through this path.

## Guardrail

```text
Rollback reactivates history; it does not delete history.
Rollback does not amend the constitution or grant authority.
```
