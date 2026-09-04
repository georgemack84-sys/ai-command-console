# Operational Policy Explanation Service

- Phase: Phase 0, Part XXI
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

The policy explanation service assembles a read-only trace for an active or specified operational-policy version: immutable version history, ordered activation/rollback events, linked governance proposal, and optional effectiveness assessment.

## Outcomes

- `COMPLETE` requires activation or rollback audit history anchoring the explained version.
- `INCOMPLETE_HISTORY` reports a stored version that lacks that anchor.
- `NOT_FOUND` and `EXPLANATION_FAILED` fail closed.

## Guardrail

```text
Policy explanation describes which version is active and why.
Policy explanation cannot activate, roll back, amend, authorize, or execute policy.
```
