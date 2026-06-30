# Phase 8M.22 Generated Truth Ledger Manifest

Status: validated and staged for commit

## Scope

Truth Ledger generated expansion covers integrity contracts and verification, tamper detection, query certification, query security tenant isolation, ledger explorer, lineage certification, truth dashboard, truth-ledger certification and completion, integrity viewer, and visibility certification.

## Included Paths

- `app/api/integrity-certification-gate/`
- `app/api/integrity-contract/`
- `app/api/integrity-verification-service/`
- `app/api/integrity-viewer/`
- `app/api/ledger-explorer/`
- `app/api/lineage-certification/`
- `app/api/query-certification-gate/`
- `app/api/query-security-tenant-isolation/`
- `app/api/tamper-detection-engine/`
- `app/api/truth-dashboard/`
- `app/api/truth-ledger-certification/`
- `app/api/truth-ledger-completion/`
- `app/api/visibility-certification/`
- `app/integrity-viewer/`
- `app/ledger-explorer/`
- `app/truth-dashboard/`
- `app/truth-ledger-certification/`
- `app/truth-ledger-completion/`
- `app/visibility-certification/`
- `components/integrity-viewer/`
- `components/ledger-explorer/`
- `components/truth-dashboard/`
- `components/truth-ledger-certification/`
- `components/visibility-certification/`
- `services/integrity-certification-gate/`
- `services/integrity-contract/`
- `services/integrity-verification-service/`
- `services/integrity-viewer/`
- `services/ledger-explorer/`
- `services/lineage-certification/`
- `services/query-certification-gate/`
- `services/query-security-tenant-isolation/`
- `services/tamper-detection-engine/`
- `services/truth-dashboard/`
- `services/truth-ledger-certification/`
- `services/truth-ledger-completion/`
- `services/visibility-certification/`
- `tests/unit/integrity-certification-gate/`
- `tests/unit/integrity-contract/`
- `tests/unit/integrity-verification-service/`
- `tests/unit/integrity-viewer/`
- `tests/unit/ledger-explorer/`
- `tests/unit/lineage-certification/`
- `tests/unit/query-certification-gate/`
- `tests/unit/query-security-tenant-isolation/`
- `tests/unit/tamper-detection-engine/`
- `tests/unit/truth-dashboard/`
- `tests/unit/truth-ledger-certification/`
- `tests/unit/truth-ledger-completion/`
- `tests/unit/visibility-certification/`
- `types/integrity-certification-gate.ts`
- `types/integrity-contract.ts`
- `types/integrity-verification-service.ts`
- `types/integrity-viewer.ts`
- `types/ledger-explorer.ts`
- `types/lineage-certification.ts`
- `types/query-certification-gate.ts`
- `types/query-security-tenant-isolation.ts`
- `types/tamper-detection-engine.ts`
- `types/truth-dashboard.ts`
- `types/truth-ledger-certification.ts`
- `types/truth-ledger-completion.ts`
- `types/visibility-certification.ts`
- Truth Ledger generated documentation listed in `docs/phase-8m-generated-truth-ledger-inventory.md`.

Candidate files: 196.

## Excluded Paths

- Planning generated domains.
- Certification generated domains outside Truth Ledger certification paths.
- Shared Contracts.
- Source changes.
- Recommendation leftovers, including `services/recommendation-constraint/index.ts`.
- Runtime leftovers, including `app/api/v1/runtime/health/route.ts` and simulation-engine tracked changes.
- Unrelated documentation.
- Phase 8M leftovers.
- Test repair.

## Domain Owner

Truth Ledger owner with security and certification reviewer support.

## Risk Level

High.

## Dependencies

Integrity verification, replay evidence, ledger immutability, query isolation, certification evidence, and operator visibility.

## Validation Commands

- `npx vitest run --config vitest.config.mjs tests/unit/truth-* tests/unit/ledger-* tests/unit/integrity-* tests/unit/visibility-certification --reporter dot`
- `npm run typecheck`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Proceed with the isolated Phase 8M.22 Truth Ledger generated-domain baseline commit.

## Commit Readiness

Ready. Targeted tests, TypeScript, classifier, and staged-diff guard passed.
