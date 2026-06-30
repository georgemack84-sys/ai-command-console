# Phase 8M.15 Generated Autonomy Manifest

Status: verified for generated-domain baseline commit

## Scope

Autonomy generated expansion covers autonomy contracts, identity, state machine, authority, constitutional constraints, governance interfaces, autonomous execution reconstruction, autonomous hash chain, autonomy query/search, controlled autonomy completion, and final autonomy certification.

## Included Paths

- `app/api/autonomous-execution-reconstruction/`
- `app/api/autonomous-hash-chain-engine/`
- `app/api/autonomy-authority/`
- `app/api/autonomy-certification-contract/`
- `app/api/autonomy-constitutional-constraints/`
- `app/api/autonomy-contract/`
- `app/api/autonomy-cross-reference-search/`
- `app/api/autonomy-governance-interfaces/`
- `app/api/autonomy-identity/`
- `app/api/autonomy-lineage-search/`
- `app/api/autonomy-query-contract/`
- `app/api/autonomy-search-engine/`
- `app/api/autonomy-state-machine/`
- `app/api/controlled-autonomy-completion-gate/`
- `app/api/final-autonomy-certification-gate/`
- `docs/phase-8a-1-autonomy-contract.md`
- `docs/phase-8a-2-autonomy-identity.md`
- `docs/phase-8a-3-autonomy-state-machine.md`
- `docs/phase-8a-4-authority-model.md`
- `docs/phase-8a-5-constitutional-constraints.md`
- `docs/phase-8a-6-governance-interfaces.md`
- `docs/phase-8g-2-autonomous-execution-reconstruction.md`
- `docs/phase-8h-2-autonomous-hash-chain-engine.md`
- `docs/phase-8i-1-autonomy-query-contract.md`
- `docs/phase-8i-2-autonomy-search-engine.md`
- `docs/phase-8i-7-autonomy-lineage-search.md`
- `docs/phase-8i-8-autonomy-cross-reference-search.md`
- `docs/phase-8k-1-autonomy-certification-contract.md`
- `docs/phase-8k-5-final-autonomy-certification-gate.md`
- `docs/phase-8l-controlled-autonomy-completion-gate.md`
- `services/autonomous-hash-chain-engine/`
- `services/autonomy-authority/`
- `services/autonomy-certification-contract/`
- `services/autonomy-constitutional-constraints/`
- `services/autonomy-contract/`
- `services/autonomy-cross-reference-search/`
- `services/autonomy-governance-interfaces/`
- `services/autonomy-identity/`
- `services/autonomy-lineage-search/`
- `services/autonomy-query-contract/`
- `services/autonomy-search-engine/`
- `services/autonomy-state-machine/`
- `services/controlled-autonomy-completion-gate/`
- `services/final-autonomy-certification-gate/`
- `tests/unit/autonomous-execution-reconstruction/`
- `tests/unit/autonomous-hash-chain-engine/`
- `tests/unit/autonomy-authority/`
- `tests/unit/autonomy-certification-contract/`
- `tests/unit/autonomy-constitutional-constraints/`
- `tests/unit/autonomy-contract/`
- `tests/unit/autonomy-cross-reference-search/`
- `tests/unit/autonomy-governance-interfaces/`
- `tests/unit/autonomy-identity/`
- `tests/unit/autonomy-lineage-search/`
- `tests/unit/autonomy-query-contract/`
- `tests/unit/autonomy-search-engine/`
- `tests/unit/autonomy-state-machine/`
- `tests/unit/controlled-autonomy-completion-gate/`
- `tests/unit/final-autonomy-certification-gate/`
- `types/autonomous-execution-reconstruction.ts`
- `types/autonomous-hash-chain-engine.ts`
- `types/autonomy-authority.ts`
- `types/autonomy-certification-contract.ts`
- `types/autonomy-constitutional-constraints.ts`
- `types/autonomy-contract.ts`
- `types/autonomy-cross-reference-search.ts`
- `types/autonomy-governance-interfaces.ts`
- `types/autonomy-identity.ts`
- `types/autonomy-lineage-search.ts`
- `types/autonomy-query-contract.ts`
- `types/autonomy-search-engine.ts`
- `types/autonomy-state-machine.ts`
- `types/controlled-autonomy-completion-gate.ts`
- `types/final-autonomy-certification-gate.ts`

Estimated generated entries: 73 classifier roots before staging expansion.

## Excluded Paths

- Mission Control generated domain, already committed in Phase 8M.14.
- Governance, Replay, Runtime, Recommendation, Truth Ledger, Recovery, Planning, Delegation, Certification, and Shared Contracts generated domains.
- 25 source changes.
- 9 unrelated documentation entries.
- 1 unrelated test repair.
- Archive candidates and experimental work.

## Domain Owner

Autonomy governance owner.

## Risk Level

High.

## Dependencies

Authority boundary, constitutional constraints, governance interfaces, replay integrity, hash-chain evidence, query isolation, controlled autonomy completion, and final autonomy certification.

## Validation Commands

- `npx vitest run --config vitest.config.mjs tests/unit/autonomous-execution-reconstruction tests/unit/autonomous-hash-chain-engine tests/unit/autonomy-authority tests/unit/autonomy-certification-contract tests/unit/autonomy-constitutional-constraints tests/unit/autonomy-contract tests/unit/autonomy-cross-reference-search tests/unit/autonomy-governance-interfaces tests/unit/autonomy-identity tests/unit/autonomy-lineage-search tests/unit/autonomy-query-contract tests/unit/autonomy-search-engine tests/unit/autonomy-state-machine tests/unit/controlled-autonomy-completion-gate tests/unit/final-autonomy-certification-gate --reporter dot`
- `npm run typecheck`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Proceed only after staged-diff verification reports zero unexpected paths and all Autonomy validation passes.

## Commit Readiness

Commit-ready. Autonomy targeted Vitest passed, TypeScript passed, classifier passed as script, and staged-diff guard reported zero unexpected paths.
