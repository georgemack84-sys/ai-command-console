# Operational Policy Effectiveness Monitoring

- Phase: Phase 0, Part XIX
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Effectiveness monitoring compares baseline and current quality reports for a specified active operational-policy version. It recommends attention; it never changes policy.

```text
Active policy + baseline report + current report
  -> HEALTHY | INCONCLUSIVE | REGRESSION_DETECTED | INSUFFICIENT_DATA
```

## Rules

- The requested policy version must still be active for its policy and scope.
- The deterministic comparison tracks deltas in overdue review work, review failures, and quarantined knowledge.
- Two or more worsening signals produce `REGRESSION_DETECTED` and recommend rollback consideration. One produces `INCONCLUSIVE` and recommends governance review.
- Incomplete source reports produce `INSUFFICIENT_DATA` and no recommendation for action.

## Guardrail

```text
Monitoring observes effects.
Governance decides action.
Rollback remains a separately authorized operation.
```
