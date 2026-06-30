# Phase 8M.13 Generated Phase Expansion Inventory

Status: generated expansion split into domain review bundles

Source: `node scripts/phase-8m-quality-gate.cjs --classify`

## Summary

Total generated entries: 850

Certification state: FAIL

The generated expansion is no longer treated as one undifferentiated block. Each generated entry is assigned to one review domain by path ownership and naming convention. These domains are planning units only; none are staged by this report.

## Domain Bucket Counts

| Domain | Count | Risk | Ownership Recommendation | Validation Required |
| --- | ---: | --- | --- | --- |
| Mission Control | 25 | High | Mission Control visibility/replay owner | Domain Vitest, typecheck, classifier, API route review |
| Autonomy | 30 | High | Autonomy governance owner | Domain Vitest, typecheck, authority-boundary review |
| Delegation | 30 | High | Delegation authority owner | Domain Vitest, typecheck, authority-validation review |
| Recovery | 49 | High | Recovery/replay owner | Domain Vitest, typecheck, recovery replay review |
| Replay | 59 | High | Replay integrity owner | Domain Vitest, typecheck, deterministic replay review |
| Truth Ledger | 64 | High | Truth Ledger owner | Domain Vitest, typecheck, evidence/integrity review |
| Runtime | 72 | High | Runtime assurance owner | Domain Vitest, typecheck, operational risk review |
| Planning | 83 | High | Planning/orchestration owner | Domain Vitest, typecheck, planning dependency review |
| Recommendation | 87 | High | Recommendation governance owner | Domain Vitest, typecheck, advisory-only review |
| Certification | 90 | High | Certification authority owner | Domain Vitest, typecheck, gate semantics review |
| Governance | 127 | High | Governance policy owner | Domain Vitest, typecheck, policy/replay review |
| Shared Types / Contracts | 134 | High | Platform contracts owner | Typecheck, import/export review, dependent domain tests |

## File Paths By Domain

The inventory assigns paths by generated family roots. Directory entries represent all files under that generated dirty root.

### Mission Control

- `app/api/mission-control-graph-visualization-engine/`
- `app/api/mission-control-operational-dashboard/`
- `app/api/mission-control-replay-investigation-workspace/`
- `app/api/mission-control-visibility-certification-gate/`
- `app/api/mission-control-visibility-contract/`
- `docs/phase-8j-1-mission-control-visibility-contract.md`
- `docs/phase-8j-2-mission-control-operational-dashboard.md`
- `docs/phase-8j-3-mission-control-graph-visualization-engine.md`
- `docs/phase-8j-4-mission-control-replay-investigation-workspace.md`
- `docs/phase-8j-5-mission-control-visibility-certification-gate.md`
- `services/mission-control-graph-visualization-engine/`
- `services/mission-control-operational-dashboard/`
- `services/mission-control-replay-investigation-workspace/`
- `services/mission-control-visibility-certification-gate/`
- `services/mission-control-visibility-contract/`
- `tests/unit/mission-control-graph-visualization-engine/`
- `tests/unit/mission-control-operational-dashboard/`
- `tests/unit/mission-control-replay-investigation-workspace/`
- `tests/unit/mission-control-visibility-certification-gate/`
- `tests/unit/mission-control-visibility-contract/`
- `tests/unit/mission-control/`
- `types/mission-control-graph-visualization-engine.ts`
- `types/mission-control-operational-dashboard.ts`
- `types/mission-control-replay-investigation-workspace.ts`
- `types/mission-control-visibility-certification-gate.ts`
- `types/mission-control-visibility-contract.ts`

### Other Domains

- Governance: `governance-*`, `policy-*`, `compliance-*`, `risk-*`, `escalation-*`, `violation-*`, `lineage-*`, and governance query families across `app/api`, `services`, `tests/unit`, `types`, and generated docs.
- Autonomy: `autonomy-*`, `autonomous-*`, and constitutional autonomy families across `app/api`, `services`, `tests/unit`, `types`, and generated docs.
- Replay: `replay-*`, historical reconstruction, replay viewer, and replay certification families.
- Runtime: runtime assurance, supervision, observation, drift health, confidence, stability, and adaptive assurance families.
- Recommendation: recommendation generation, validation, paths, constraints, resilience, trust, dependency, portfolio, opportunity, impact, and certification families.
- Truth Ledger: truth dashboard, ledger explorer, integrity viewer, visibility certification, truth-ledger certification, and completion families.
- Recovery: recovery contract, failure analysis, planning, validation, recommendation, replay, rollback, and intervention families.
- Planning: objective decomposition, dependency analysis, planning optimization, alternative planning, contingency planning, workflow, sequencing, scheduler, execution, checkpoint, and orchestration families.
- Delegation: delegation contract, task classification, authority validation, routing, orchestration lookup, and delegation certification families.
- Certification: generated certification gates, deterministic validation, security governance validation, isolation validation, and final certification families.
- Shared Types / Contracts: shared `types/*`, generated contract families, and shared type surfaces that must be reviewed with their consuming domains.

## Review Order

1. Mission Control
2. Autonomy
3. Delegation
4. Recovery
5. Replay
6. Truth Ledger
7. Runtime
8. Planning
9. Recommendation
10. Certification
11. Governance
12. Shared Types / Contracts

## Phase 8M.13 First Domain Review

Domain selected first: Mission Control.

Reason: smallest generated domain by governed domain count after keeping mission-control type and contract paths with the domain.

Validation performed:

- Mission Control targeted Vitest: PASS, 5 files and 104 tests.
- `npm run typecheck`: PASS.
- `node scripts/phase-8m-quality-gate.cjs --classify`: PASS as script.

Commit readiness: review-ready, not staged. Mission Control can become the first generated-domain commit only after final staged-diff verification confirms that no non-Mission-Control generated entries, Bundle C source changes, unrelated docs, test repair, or Phase 8M leftovers are included.
