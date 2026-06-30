# Phase 8M.13 Generated Shared Contracts Manifest

Status: ready for Phase 8M.25 Shared Contracts staging

## Scope

Shared Types / Contracts covers generated `types/*`, contract families, shared type surfaces, and cross-domain exports that can affect multiple generated domains.

## Included Paths

- `types/*.ts`
- generated `*-contract` families not assigned to a stronger owning domain
- generated service `types.ts` files
- generated shared contract docs

Accepted Phase 8M.25 contract families:

- `compliance-contract`
- `escalation-contract`
- `prediction-contract`

Accepted generated path entries: 16.

## Excluded Paths

Mission Control type files stay with Mission Control for the first domain review. Other tightly-coupled domain-specific types may move with their owning domain after reviewer approval.

## Domain Owner

Platform contracts owner.

## Risk Level

High.

## Dependencies

All generated domains.

## Validation Commands

- `npm run typecheck`
- dependent domain Vitest suites for any accepted contract subset
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Commit the accepted Shared Contracts family as the final generated-domain boundary. Keep remaining non-contract generated artifacts out of this commit and reconcile them separately.

## Commit Readiness

Ready after Shared Contracts validation and staged-diff guard pass.
