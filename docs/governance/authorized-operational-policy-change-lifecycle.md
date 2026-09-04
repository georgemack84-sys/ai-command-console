# Authorized Operational Policy Change Lifecycle

- Phase: Phase 0, Part XVII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

This boundary activates a specific immutable version of an operational policy after governance approval and independent activation authorization.

```text
APPROVED_FOR_POLICY_CHANGE proposal
  + activation plan
  + independent activator authorization
  -> active operational policy version + audit
```

## Rules

- Only policy IDs that are not constitutional targets are eligible. Any policy ID containing `constitution` is rejected.
- Activation requires proposal linkage, proposal approval for the same policy ID, a content hash, impact analysis, migration plan, rollback plan, effective timestamp, provenance, and constitution-version reference.
- Approval to consider a policy change is insufficient by itself; `PolicyActivatorAuthorizer` separately verifies activation authority.
- Each policy/version/scope tuple is immutable. The same tuple and payload replays idempotently; a different payload is rejected.
- The repository maintains one active version per operational policy and scope, preserving all prior versions.

## Guardrail

```text
Operational policy activation != Learning Constitution amendment
Proposal approval != activation authority
Policy activation != learned knowledge or execution permission
```
