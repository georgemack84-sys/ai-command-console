# Phase 8M.19 Generated Replay Manifest

Status: verified for generated-domain baseline commit

## Scope

Replay generated expansion covers replay contracts, replay viewing, historical replay queries, replay integrity certification, replay certification gates, deterministic reconstruction, and planning-decision reconstruction from immutable Replay Contract evidence.

## Included Paths

- `app/api/planning-decision-reconstruction/`
- `app/api/replay-certification-gate/`
- `app/api/replay-contract/`
- `app/api/replay-historical-reconstruction-query/`
- `app/api/replay-integrity-certification-engine/`
- `app/api/replay-viewer/`
- `app/replay-viewer/`
- `components/replay-viewer/`
- `docs/phase-6h-1-replay-contract.md`
- `docs/phase-6h-2-replay-input-reconstruction.md`
- `docs/phase-6h-3-replay-state-reconstruction.md`
- `docs/phase-6h-4-replay-output-verification.md`
- `docs/phase-6h-5-replay-determinism-gate.md`
- `docs/phase-6j-3-historical-reconstruction.md`
- `docs/phase-6k-2-replay-viewer.md`
- `docs/phase-7l-2-deterministic-replay-validation.md`
- `docs/phase-8g-1-replay-contract.md`
- `docs/phase-8g-3-planning-decision-reconstruction.md`
- `docs/phase-8g-5-replay-certification-gate.md`
- `docs/phase-8i-6-replay-historical-reconstruction-query.md`
- `docs/phase-8k-4-replay-integrity-certification-engine.md`
- `services/planning-decision-reconstruction/`
- `services/replay-certification-gate/`
- `services/replay-contract/`
- `services/replay-historical-reconstruction-query/`
- `services/replay-integrity-certification-engine/`
- `services/replay-viewer/`
- `tests/unit/planning-decision-reconstruction/`
- `tests/unit/replay-certification-gate/`
- `tests/unit/replay-contract/`
- `tests/unit/replay-historical-reconstruction-query/`
- `tests/unit/replay-integrity-certification-engine/`
- `tests/unit/replay-viewer/`
- `types/planning-decision-reconstruction.ts`
- `types/replay-certification-gate.ts`
- `types/replay-contract.ts`
- `types/replay-historical-reconstruction-query.ts`
- `types/replay-integrity-certification-engine.ts`
- `types/replay-viewer.ts`

Generated entries discovered: 39 classifier roots before staging expansion.

## Excluded Paths

- Mission Control, Autonomy, Delegation, Recovery, and Governance generated domains, already committed.
- Runtime, Recommendation, Truth Ledger, Planning outside Replay reconstruction, Certification outside Replay certification roots, and Shared Contracts generated domains.
- 25 tracked source changes.
- 9 unrelated documentation entries.
- 10 Phase 8M stabilization leftovers.
- 1 unrelated test repair.
- Archive candidates and experimental work.

## Domain Owner

Replay integrity owner with certification authority review.

## Risk Level

High.

## Dependencies

Replay depends on immutable evidence, deterministic reconstruction, replay contract packages, hash integrity, certification evidence, audit visibility, and historical reconstruction queries.

## Validation Commands

- `npx vitest run --config vitest.config.mjs tests/unit/planning-decision-reconstruction tests/unit/replay-certification-gate tests/unit/replay-contract tests/unit/replay-historical-reconstruction-query tests/unit/replay-integrity-certification-engine tests/unit/replay-viewer --reporter dot`
- `npm run typecheck`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Proceed only after staged-diff verification reports zero unexpected paths and Replay validation passes.

## Commit Readiness

Commit-ready. Replay targeted Vitest passed, TypeScript passed, classifier passed as script, and staged-diff guard reported zero unexpected paths.
