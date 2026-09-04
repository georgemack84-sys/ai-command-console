# Knowledge Retirement and Quarantine Lifecycle

- Phase: Phase 0, Part XI
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Retirement removes an active knowledge record from normal applicability while preserving its content, provenance, lineage, and audit history.

```text
ACTIVE -> ARCHIVED     (retired, retained historically)
ACTIVE -> QUARANTINED  (not reliable pending review)
```

## Rules

- Only active records may transition.
- Every transition requires a non-empty explicit reason, valid policy and constitution versions, and a valid lineage identity.
- Archive and quarantine are idempotent only when the record is already in the requested completed state.
- `KNOWLEDGE_ARCHIVED` and `KNOWLEDGE_QUARANTINED` are appended to the audit ledger. Production adapters must make the record transition and audit append transactional.
- Records are never deleted or overwritten. Retrieval excludes both states from normal applicability while direct historical reads remain possible.

## Guardrails

```text
Retirement != deletion
Quarantine != proof of falsehood
Archive != supersession
Lifecycle transition != authority change
```
