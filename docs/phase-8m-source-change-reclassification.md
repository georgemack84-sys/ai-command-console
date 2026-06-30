# Phase 8M.37 Source Change Reclassification

## Scope

Phase 8M.37 reclassifies the five remaining source-change entries after the EdgeBook foundation commit.

Source entries reviewed: 5.

Source files reviewed: 91.

## Reclassification Table

| File or path | Category | Dependency status | Recommended action | Risk | Validation requirement |
| --- | --- | --- | --- | --- | --- |
| `services/autonomous-execution-reconstruction/` | Source service root | No remaining residual generated dependency identified. Uses committed replay contract, confidence engine, and autonomous execution reconstruction types. | Ready for source-only commit. | Medium | Existing autonomous execution reconstruction unit suite plus TypeScript, lint, classifier. |
| `services/decision-graph/` | Source service root | Paired untracked unit tests exist under `tests/unit/decision-graph/`; tests are validation evidence and remain outside the source-only stage boundary. No required generated artifact must be staged with the source files. | Ready for source-only commit. | High | Decision graph unit suite plus TypeScript, lint, classifier. |
| `services/escalation-intelligence/` | Source service root | Depends on committed decision graph exports and has paired untracked validation under `tests/unit/escalation-intelligence/`; tests remain outside the source-only commit. | Ready for source-only commit. | High | Escalation intelligence unit suite plus TypeScript, lint, classifier. |
| `services/mission-control/` | Source service root | Large Mission Control service surface with existing tracked unit coverage under `tests/unit/mission-control/`. No residual generated artifact is required for staging. | Ready for source-only commit. | High | Mission Control unit suite plus TypeScript, lint, classifier. |
| `services/strategic-readiness/` | Source service root | Depends on committed decision graph, escalation intelligence, recommendation ledger, and recommendation governance surfaces. Paired untracked validation exists under `tests/unit/strategic-readiness/`; tests remain outside the source-only commit. | Ready for source-only commit. | High | Strategic readiness unit suite plus TypeScript, lint, classifier. |

## Deferred Items

The following remain outside the Phase 8M.37 source commit:

- `docs/phase-6i-2-hash-chain-engine.md`
- `docs/phase-6j-2-search-engine.md`
- `services/signal-engine/**`
- `tests/unit/decision-graph/**`
- `tests/unit/escalation-intelligence/**`
- `tests/unit/signal-engine/**`
- `tests/unit/strategic-readiness/**`
- `src/tests/**`

## Stage Recommendation

Stage only:

- `services/autonomous-execution-reconstruction/**`
- `services/decision-graph/**`
- `services/escalation-intelligence/**`
- `services/mission-control/**`
- `services/strategic-readiness/**`
- Phase 8M.37 evidence and report updates

Do not stage residual generated artifacts or `src/tests/**`.

## Commit Readiness

Ready if the stage guard confirms only approved source service roots and Phase 8M evidence reports are staged, targeted validation passes, TypeScript passes, lint passes, and the Phase 8M classifier passes.
