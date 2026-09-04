# Learning Decision Model

- Phase: Phase 0, Part VI
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependencies: classification, scope, conflict detection, validation, approval, and policy context

## Purpose

The learning decision engine translates completed validation and approval evidence into the canonical disposition: `ACCEPT`, `REJECT`, `DEFER`, `REQUIRE_VALIDATION`, `REQUIRE_APPROVAL`, `CONFLICT`, or `QUARANTINE`.

```text
Validated != Approved
Approved != Persisted
Accept != Durable Knowledge
```

`ACCEPT` means only that a candidate is eligible for a future durable-admission operation. The engine does not create a knowledge record.

## Approval context

Approval is typed as `NOT_REQUIRED`, `PENDING`, `APPROVED`, `REJECTED`, or `EXPIRED`. An approved context must include a stable approval ID, approver, time, and scope compatible with the candidate's resolved scope. Approval is governance evidence, not an authority grant.

## Baseline decisions

| Condition | Disposition |
| --- | --- |
| Valid candidate and no required approval | `ACCEPT` |
| Required approval pending | `REQUIRE_APPROVAL` |
| Required approval approved in compatible scope | `ACCEPT` |
| Rejected or expired approval | `REJECT` |
| Validation requires evidence or clarification | `REQUIRE_VALIDATION` |
| Validation requires conflict review | `CONFLICT` |
| Validation quarantines candidate | `QUARANTINE` |
| Validation is invalid | `REJECT` |
| Missing policy context or inconsistent upstream records | `DEFER` |

## Constitutional guardrails

The engine rejects requests attempting to amend the constitution, alter authority through learning, automatically learn all conversation, promote unknown scope, silently resolve a conflict, grant procedure execution permission, or count agent-generated evidence as independent validation.

Every result preserves policy and constitution versions and explicitly reports:

```text
persistenceEffect = NONE
authorityEffect = UNCHANGED
executionPermissionGranted = false
```

The later durable-admission boundary owns persistence. The execution authority system remains separate.
