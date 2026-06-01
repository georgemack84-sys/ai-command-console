# ADR-0001: Preserve Read-Only Advisory Boundaries

Status: Accepted

## Context

The advisory evidence lifecycle exposes risk, evidence, verification, review, archive, retention, certification, and completion state to operators. These surfaces are useful only if they cannot silently become control paths.

## Decision

Advisory lifecycle outputs remain read-only or advisory-only. UI components, exports, verifications, reviews, seals, and documentation must not create deployment, retry, rollback, cancel, resume, approval, override, delete, compact, trust, import, or workflow authority.

## Alternatives Considered

- Let verified evidence become trusted automatically.
- Let review UI actions trigger workflow controls.
- Treat verification success as permission to mutate live advisory state.

These alternatives were rejected because they collapse evidence visibility into operational authority.

## Consequences

- Operators can inspect and reason about evidence.
- Control actions require separate explicit governance phases.
- Tests must continue asserting all `may*` fields are false where present.

## Related Seal Commits

- `3674ed5` Seal advisory evidence lifecycle completion bundle chain
- `62a87a7` Seal advisory evidence lifecycle completion review
- `70a9d05` Seal advisory evidence lifecycle certification chain
