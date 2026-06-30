# Phase 8M.13 Generated Certification Manifest

Status: planned, not staged

## Scope

Certification generated expansion covers generated certification gates, deterministic validation, security governance validation, isolation validation, boundary certification, controlled autonomy completion, and final certification families.

## Included Paths

- `app/api/*certification*`
- `app/api/*certification-gate*`
- `app/api/deterministic-validation-engine/`
- `app/api/security-governance-validation-engine/`
- matching `services/*`, `tests/unit/*`, `types/*`, and generated docs

Estimated generated entries: 90.

## Excluded Paths

Domain-owned certification gates remain with their domains when they are tightly coupled, such as Mission Control visibility certification.

## Domain Owner

Certification authority owner.

## Risk Level

High.

## Dependencies

Governance, replay, runtime, autonomy, truth ledger, and generated shared contracts.

## Validation Commands

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/*certification* tests/unit/*certification-gate* tests/unit/deterministic-validation-engine tests/unit/security-governance-validation-engine --reporter dot`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Do not merge until certification semantics are manually reviewed.

## Commit Readiness

Not ready.
