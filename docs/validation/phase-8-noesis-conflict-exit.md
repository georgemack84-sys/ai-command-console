# Phase 8 — Noesis Conflict Engine Exit Assessment

**Status:** Not ready to close

## Evidence established

- Conflict records, proposals, decisions, resolutions, clarification, escalation, reassessment, conflict sets, and evidence packages are immutable provenance artifacts.
- Resolution outcomes are guarded: supersession, rejection, exception, narrowing, and merge all require the appropriate durable artifacts and a human decision.
- The primary Noesis-backed workspace promotion path analyzes its candidate before promotion and fails closed on unresolved conflicts.
- Conflict retrieval supports integrity diagnostics and ledger-derived metrics.
- Quarantined durable knowledge is excluded from conflict search and therefore cannot influence promotion analysis.
- `npx tsc --noEmit` completed successfully during this assessment.

## Acceptance coverage

The test matrix is maintained in [phase-8-acceptance-matrix.md](phase-8-acceptance-matrix.md). It covers correction lineage, agent authority boundaries, exceptions, merge, scope narrowing, escalation, conflict sets, reassessment, and integrity findings.

## Exit blockers

1. **Test-run evidence:** focused Vitest commands reach the runner banner in this workspace but return no assertion summary. A completed run in a functioning test-run environment must be captured.
2. **Atomic resolution persistence:** the generic provenance ledger guarantees append-only records, but a resolution and its relationships are currently persisted sequentially. Phase 8 requires a transactional persistence boundary for production conflict execution.
3. **Promotion-path audit:** the primary Noesis-backed workspace promotion path is integrated. Any future durable-promotion entry point must be required to call `PromotionConflictAnalysisService` before admission.

Until those items are closed, the engine is implementation-ready for controlled testing but does not meet the Phase 8 completion gate.
