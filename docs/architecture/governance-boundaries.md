# Advisory Evidence Governance Boundaries

Status: documented after completion bundle final seal

## Core Boundary

Documentation, dashboards, read models, exports, verifications, reviews, archive entries, summaries, certifications, completions, and seals preserve evidence. They do not create lifecycle authority.

## Allowed Authorities

```text
READ_ONLY
ADVISORY_ONLY
```

These authorities may summarize, display, classify, verify, dispute, fail closed, and explain.

## Forbidden Authority

Lifecycle evidence layers may not:

- deploy
- retry
- cancel
- rollback
- resume
- approve
- override
- delete
- compact
- import into live state
- mark trusted
- trigger workflows
- mutate runtime state
- change database schema

## No Live Import

Exported evidence can be reviewed and verified. It cannot be imported into live advisory state by this lifecycle. Review UI layers must display `importedToLiveState = false` when that field exists.

## No Trusted State

The lifecycle exposes `trusted = false`. A verified bundle or certified chain proves integrity of evidence, not operational trust. Trust creation would require a separate explicit governance phase and is not part of this lifecycle.

## Verification Before Review

Review layers consume verification results. This preserves the boundary between generated artifacts and operator inspection.

```text
artifact -> verification result -> review UI
```

Forbidden:

```text
artifact -> review UI
```

## Failure Posture

Unknown, missing, malformed, mismatched, or authority-leaking evidence must become disputed or failed. It must not become trusted, imported, or executable.

## UI Boundary

Review UI components must not:

- call builders
- call verifiers
- import hash utilities
- recompute hashes
- read live advisory state
- add API routes
- add server actions
- render control buttons

Display-only copy and read-only sorting/grouping are acceptable.
