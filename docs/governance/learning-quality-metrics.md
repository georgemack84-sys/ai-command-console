# Learning Quality Metrics and Governance Reporting

- Phase: Phase 0, Part XV
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Quality reporting aggregates governed records, audit history, and review work into a reproducible read-only report. It describes observed system behavior; it does not determine truth or enact policy.

## Metrics

Reports provide scoped, windowed counts for knowledge lifecycle states; admission, correction, exception, archive, quarantine, and review events; review-work queue backlog; overdue queued work; and provenance/version completeness.

An optional overdue-work threshold creates an `OVERDUE_REVIEW_BACKLOG_EXCEEDED` recommendation. An empty matching data set yields `INSUFFICIENT_DATA`, not a fabricated trend.

## Guardrails

```text
Metrics describe quality.
Metrics do not admit, revalidate, retire, correct, or execute knowledge.
Alerts recommend attention.
Alerts do not change authority or policy.
```
