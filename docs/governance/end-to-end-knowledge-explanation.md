# End-to-End Knowledge Explanation Service

- Phase: Phase 0, Part XX
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Explanation assembles a deterministic, read-only trace for one knowledge record: durable content and provenance, ordered audit history, review and freshness information, and correction/exception relationships.

## Outcomes

- `COMPLETE` means an admission event anchors the trace.
- `INCOMPLETE_HISTORY` preserves and reports a record that lacks that admission anchor.
- `NOT_FOUND` and `OUT_OF_SCOPE` fail closed before exposing a trace.
- `EXPLANATION_FAILED` contains infrastructure failure without claiming a history.

## Guardrail

```text
Explanation describes why governed knowledge exists and changed.
Explanation does not change knowledge, policy, lifecycle, authority, or execution permission.
```
