# Phase 8M.26 Source / Generated Dependency Analysis

Status: analyzed, not staged for implementation

## Summary

- Bundle C source entries: 14.
- Source entries blocked by residual generated artifacts: 11.
- Source entries ready for a narrow stabilization commit: 3.
- Residual generated entries requiring disposition: 40.

## Dependency Graph

```text
app/globals.css
app/layout.tsx
next.config.ts
  -> no residual generated dependency identified

services/simulation-engine/index.ts
services/simulation-engine/types.ts
services/simulation-engine/intentSimulationCompletionCertificationGate.ts
tests/unit/simulation-engine/intentSimulationCompletionCertificationGate.test.ts
  -> runtime simulation completion follow-up

services/recommendation-constraint/index.ts
  -> previously committed recommendation-constraint generated modules

services/historical-intelligence-engine/
types/historical-intelligence-engine.ts
tests/unit/historical-intelligence-engine/
app/api/historical-intelligence-engine/
docs/phase-8alt-3-2-historical-intelligence-engine.md
  -> prerequisite for risk forecasting

services/risk-forecasting-engine/
types/risk-forecasting-engine.ts
tests/unit/risk-forecasting-engine/
app/api/risk-forecasting-engine/
docs/phase-8alt-3-3-risk-forecasting-engine.md
  -> depends on historical intelligence

services/decision-influence-analysis/
types/decision-influence-analysis.ts
tests/unit/decision-influence-analysis/
app/api/decision-influence-analysis/
docs/phase-7g-3-decision-influence-analysis.md
  -> governance intelligence bundle

services/violation-patterns/
types/violation-patterns.ts
tests/unit/violation-patterns/
app/api/violation-patterns/
docs/phase-7c-2-violation-pattern-detection.md
  -> governance risk bundle

src/core/
src/edgebook/
src/index.ts
src/modules/
tests/unit/edgebook/
docs/phase-1-*.md
  -> EdgeBook foundation bundle
```

## Blocking Relationships

- `services/risk-forecasting-engine/` is blocked by `services/historical-intelligence-engine/` and `types/historical-intelligence-engine.ts`.
- `types/risk-forecasting-engine.ts` imports historical intelligence types and is not independently committable.
- `services/decision-influence-analysis/` is blocked by its residual API, type, test, and documentation entries.
- `services/violation-patterns/` is blocked by its residual API, type, test, and documentation entries.
- `src/core/`, `src/edgebook/`, `src/index.ts`, and `src/modules/` are blocked by EdgeBook tests and phase-1 documentation disposition.
- `services/decision-graph/`, `services/escalation-intelligence/`, `services/signal-engine/`, and `services/strategic-readiness/` are blocked by paired residual tests or missing owner disposition.
- `services/simulation-engine` completion certification changes must be staged together with the completion gate and test.

## Commit Sequencing

1. Optional narrow source stabilization commit: `app/globals.css`, `app/layout.tsx`, and `next.config.ts`.
2. Runtime simulation completion follow-up bundle.
3. Recommendation constraint export follow-up bundle.
4. Predictive intelligence residual generated bundle: historical intelligence first, then risk forecasting.
5. Governance risk/intelligence residual generated bundle: decision influence and violation patterns.
6. EdgeBook foundation bundle with `src/` implementation, phase-1 docs, and EdgeBook tests.
7. Manual review bundle for remaining source-classified services and documentation-only generated leftovers.

## Validation Implications

- TypeScript and classifier are sufficient for discovery in Phase 8M.26.
- Bundle implementation phases must add targeted tests for each accepted bundle.
- Production build remains required before certification can move from FAIL to PASS.
