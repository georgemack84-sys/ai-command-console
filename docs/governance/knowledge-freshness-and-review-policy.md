# Knowledge Freshness and Review-Due Policy

- Phase: Phase 0, Part XIII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Freshness policy determines whether active knowledge is current, due for review, overdue, or unconfigured. It creates no lifecycle transition by itself.

```text
Active record + latest review + matching policy
  -> CURRENT
  -> REVIEW_DUE       (recommend revalidation)
  -> OVERDUE          (recommend review for quarantine)
```

## Policy resolution

- A policy matches by classification; an exact scope policy takes precedence over a classification-wide policy.
- A missing policy yields `NO_REVIEW_POLICY` and recommends no action.
- Multiple equally applicable policies, invalid intervals/grace periods, or invalid timestamps yield `INVALID_POLICY` and recommend no action.
- The latest revalidation timestamp is the freshness basis; if none exists, admission timestamp is used.

## Guardrails

```text
Review due != automatic revalidation
Overdue != automatic quarantine
Freshness assessment != lifecycle mutation
Freshness assessment != authority or execution permission
```

Retrieval may expose the assessment when configured with an evaluator. The result remains informational until an explicit review or lifecycle request enters its existing governed boundary.
