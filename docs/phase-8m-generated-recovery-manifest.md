# Phase 8M.17 Generated Recovery Manifest

Status: verified for generated-domain baseline commit

## Scope

Recovery generated expansion covers recovery contract, failure analysis, recovery planning, recovery validation, recovery recommendation, recovery replay, rollback preparation, intervention recommendation, recovery intervention intelligence, supervision intervention lookup/replay, and recovery intelligence certification.

## Included Paths

- `app/api/failure-analysis-engine/`
- `app/api/intervention-recommendation-engine/`
- `app/api/recovery-contract/`
- `app/api/recovery-intelligence-certification-gate/`
- `app/api/recovery-intervention-intelligence/`
- `app/api/recovery-planning-engine/`
- `app/api/recovery-recommendation-engine/`
- `app/api/recovery-replay-engine/`
- `app/api/recovery-validation-engine/`
- `app/api/rollback-preparation/`
- `app/api/supervision-intervention-boundary-lookup/`
- `app/api/supervision-intervention-replay/`
- `docs/phase-8alt-2-1-recovery-contract.md`
- `docs/phase-8alt-2-2-failure-analysis-engine.md`
- `docs/phase-8alt-2-3-recovery-planning-engine.md`
- `docs/phase-8alt-2-4-recovery-validation-engine.md`
- `docs/phase-8alt-2-5-recovery-recommendation-engine.md`
- `docs/phase-8alt-2-6-recovery-replay-engine.md`
- `docs/phase-8alt-2-7-recovery-intelligence-certification-gate.md`
- `docs/phase-8c-7-rollback-preparation-engine.md`
- `docs/phase-8e-4-recovery-intervention-intelligence.md`
- `docs/phase-8e-d-intervention-recommendation-engine.md`
- `docs/phase-8g-4-supervision-intervention-replay.md`
- `docs/phase-8i-5-supervision-intervention-boundary-lookup.md`
- `services/failure-analysis-engine/`
- `services/intervention-recommendation-engine/`
- `services/recovery-contract/`
- `services/recovery-intelligence-certification-gate/`
- `services/recovery-intervention-intelligence/`
- `services/recovery-planning-engine/`
- `services/recovery-recommendation-engine/`
- `services/recovery-replay-engine/`
- `services/recovery-validation-engine/`
- `services/supervision-intervention-boundary-lookup/`
- `services/supervision-intervention-replay/`
- `tests/unit/failure-analysis-engine/`
- `tests/unit/intervention-recommendation-engine/`
- `tests/unit/recovery-contract/`
- `tests/unit/recovery-intelligence-certification-gate/`
- `tests/unit/recovery-intervention-intelligence/`
- `tests/unit/recovery-planning-engine/`
- `tests/unit/recovery-recommendation-engine/`
- `tests/unit/recovery-replay-engine/`
- `tests/unit/recovery-validation-engine/`
- `tests/unit/rollback-preparation/`
- `tests/unit/supervision-intervention-boundary-lookup/`
- `tests/unit/supervision-intervention-replay/`
- `types/failure-analysis-engine.ts`
- `types/intervention-recommendation-engine.ts`
- `types/recovery-contract.ts`
- `types/recovery-intelligence-certification-gate.ts`
- `types/recovery-intervention-intelligence.ts`
- `types/recovery-planning-engine.ts`
- `types/recovery-recommendation-engine.ts`
- `types/recovery-replay-engine.ts`
- `types/recovery-validation-engine.ts`
- `types/rollback-preparation.ts`
- `types/supervision-intervention-boundary-lookup.ts`
- `types/supervision-intervention-replay.ts`

Estimated generated entries: 58 classifier roots before staging expansion.

## Excluded Paths

- Mission Control, Autonomy, and Delegation generated domains, already committed.
- Governance, Replay, Runtime, Recommendation, Truth Ledger, Planning, Certification, and Shared Contracts generated domains.
- 25 source changes.
- 9 unrelated documentation entries.
- 1 unrelated test repair.
- Archive candidates and experimental work.

## Domain Owner

Recovery/replay owner.

## Risk Level

High.

## Dependencies

Recovery depends on runtime assurance, replay integrity, recommendation advisory behavior, intervention boundaries, rollback planning, and recovery certification evidence. Supervision intervention lookup/replay paths remain in this bundle because they are generated intervention recovery roots and are classified as generated phase expansion.

## Validation Commands

- `npx vitest run --config vitest.config.mjs tests/unit/failure-analysis-engine tests/unit/intervention-recommendation-engine tests/unit/recovery-contract tests/unit/recovery-intelligence-certification-gate tests/unit/recovery-intervention-intelligence tests/unit/recovery-planning-engine tests/unit/recovery-recommendation-engine tests/unit/recovery-replay-engine tests/unit/recovery-validation-engine tests/unit/rollback-preparation tests/unit/supervision-intervention-boundary-lookup tests/unit/supervision-intervention-replay --reporter dot`
- `npm run typecheck`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Proceed only after staged-diff verification reports zero unexpected paths and all Recovery validation passes.

## Commit Readiness

Commit-ready. Recovery targeted Vitest passed, TypeScript passed, classifier passed as script, and staged-diff guard reported zero unexpected paths.
