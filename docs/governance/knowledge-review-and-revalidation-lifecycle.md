# Knowledge Review and Revalidation Lifecycle

- Phase: Phase 0, Part XII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Revalidation records whether active knowledge has been confirmed against specified evidence. It records review history; it does not silently alter knowledge lifecycle or authority.

```text
ACTIVE knowledge + evidence
  -> CONFIRMED     -> KNOWLEDGE_REVALIDATED
  -> UNVERIFIABLE  -> KNOWLEDGE_REVIEW_FAILED + recommend QUARANTINED
  -> CONTRADICTED  -> KNOWLEDGE_REVIEW_FAILED + recommend QUARANTINED
```

## Rules

- Reviews require a stable review ID, active target record, non-empty evidence IDs, identified reviewer, and valid lineage/version data.
- Review IDs are idempotent only when reused with the same knowledge record and outcome; conflicting reuse is rejected.
- Failed review does not quarantine, archive, supersede, or delete knowledge. It returns a recommendation that must be enacted through the existing retirement or correction boundary.
- Every outcome has an audit event. Production adapters must make review persistence and audit emission transactional.
- Retrieval exposes the latest review metadata of the retrieved base record, without treating review outcome as authority or execution permission.

## Guardrail

```text
Review records evidence.
Lifecycle boundaries change lifecycle.
Retrieval reports freshness.
None of these grants authority.
```
