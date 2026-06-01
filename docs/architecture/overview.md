# Advisory Evidence Lifecycle Architecture Overview

Status: documented after completion bundle final seal

## Purpose

The advisory evidence lifecycle makes operator-facing advisory state portable, verifiable, replayable, and reviewable without creating runtime authority.

The lifecycle exists to answer four questions:

- What advisory evidence was produced?
- Can the evidence be verified from deterministic hashes and sealed inputs?
- Can an operator inspect the evidence without importing it into live state?
- Which seals prove the lifecycle was complete at the time of review?

## Architectural Philosophy

The system separates generation, verification, inspection, and sealing.

```text
generate
verify
inspect
seal
```

Each step consumes the previous step's output as an object boundary. UI layers consume verification or read model objects only. They do not call builders, verifiers, hash utilities, live advisory state, API routes, or workflow controls.

## Major Lifecycle Chains

- Advisory source adapters convert workstream outputs into read-only or advisory-only results.
- Unified advisory aggregation combines contained advisory sources without creating authority.
- Advisory dashboard and read model expose state for operator inspection.
- Snapshot export, verification, offline review, archive index, archive UI, archive summary, and summary UI preserve evidence reviewability.
- Lifecycle rollup, retention policy, export bundle, bundle verification, bundle review UI, and final seal package archive evidence.
- Certification gate, certification review UI, final certification seal, completion report, completion review UI, completion export bundle, completion bundle verification, completion bundle review UI, and final completion bundle seal close the lifecycle.

## Determinism Model

Deterministic outputs use stable serialization, stable ordering, and hash material that excludes runtime-only fields such as `generatedAt`. Timestamps may exist for operator context, but they must not affect hash validity unless explicitly documented by the producing service.

## Operator Model

Operators inspect evidence through read-only dashboards and review panels. Operators may see warnings, disputes, missing fields, verification failures, and seal status. These views do not create approval, override, import, deployment, retry, rollback, cancel, resume, delete, compact, trust, or workflow authority.

## Authority Model

Safe advisory lifecycle outputs preserve these defaults:

```text
authority = READ_ONLY or ADVISORY_ONLY
trusted = false
importedToLiveState = false
all may* control fields = false
```

Any attempted authority leak must be visible as a disputed or failed state, not promoted into operational control.

## Related Documents

- [Lifecycle Map](./lifecycle-map.md)
- [Governance Boundaries](./governance-boundaries.md)
- [Operator Handbook](./operator-handbook.md)
- [Verification Workflows](./verification-workflows.md)
- [Seal History](./seal-history.md)
- [Phase Lineage](./phase-lineage.md)
