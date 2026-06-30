# Phase 8M.18 Generated Governance Manifest

Status: verified for generated-domain baseline commit

## Scope

Governance generated expansion covers governance intelligence, policy intelligence, authority boundaries, boundary enforcement, deterministic governance replay, governance integrity, governance query, governance risk, governance visibility, and security-governance validation.

This bundle also includes generated Governance UI surfaces because they are dirty generated Governance roots with matching services, tests, types, and documentation.

## Included Paths

The exact inventory is recorded in `docs/phase-8m-generated-governance-inventory.md`.

Included generated roots:

- `app/api/authority-boundary-engine/`
- `app/api/boundary-enforcement-contract/`
- `app/api/governance-*/`
- `app/api/policy-*/`
- `app/api/security-governance-validation-engine/`
- `app/governance-dashboard/`
- `app/governance-integrity-viewer/`
- `app/governance-lineage-explorer/`
- `app/governance-replay-viewer/`
- `components/governance-dashboard/`
- `components/governance-integrity-viewer/`
- `components/governance-lineage-explorer/`
- `components/governance-replay-viewer/`
- `services/authority-boundary-engine/`
- `services/boundary-enforcement-contract/`
- `services/governance-*/`
- `services/policy-*/`
- `services/security-governance-validation-engine/`
- `tests/unit/authority-boundary-engine/`
- `tests/unit/boundary-enforcement-contract/`
- `tests/unit/governance-*/`
- `tests/unit/policy-*/`
- `tests/unit/security-governance-validation-engine/`
- `types/authority-boundary-engine.ts`
- `types/boundary-enforcement-contract.ts`
- `types/governance-*.ts`
- `types/policy-*.ts`
- `types/security-governance-validation-engine.ts`
- Generated Governance and Policy docs listed in the inventory.

Generated entries discovered: 228 classifier roots before staging expansion.

## Excluded Paths

- Mission Control, Autonomy, Delegation, and Recovery generated domains, already committed.
- Replay, Runtime, Recommendation, Truth Ledger, Planning, Certification, and Shared Contracts generated domains.
- `services/recommendation-governance/` and `tests/unit/recommendation-governance/`, because Recommendation is explicitly excluded from Phase 8M.18.
- 25 tracked source changes.
- 9 unrelated documentation entries.
- 11 Phase 8M stabilization leftovers.
- 1 unrelated test repair.
- Archive candidates and experimental work.

## Domain Owner

Governance policy owner with certification authority review.

## Risk Level

High.

## Dependencies

Governance depends on replay fidelity, immutable evidence, policy correlation, authority boundary validation, governance certification gates, query reconstruction, integrity verification, and security-governance validation.

## Validation Commands

- `npx vitest run --config vitest.config.mjs tests/unit/authority-boundary-engine tests/unit/boundary-enforcement-contract tests/unit/governance-assurance-engine tests/unit/governance-authority-boundary-validation tests/unit/governance-certification-orchestrator tests/unit/governance-cross-ledger-correlation tests/unit/governance-dashboard tests/unit/governance-deterministic-replay-validation tests/unit/governance-explainability tests/unit/governance-hash-chain tests/unit/governance-historical-reconstruction tests/unit/governance-input-reconstruction tests/unit/governance-integrity-certification tests/unit/governance-integrity-contract tests/unit/governance-integrity-validation tests/unit/governance-integrity-verification tests/unit/governance-integrity-viewer tests/unit/governance-intelligence-completion-gate tests/unit/governance-intelligence tests/unit/governance-isolation-validation tests/unit/governance-lineage-explorer tests/unit/governance-lineage tests/unit/governance-output-verification tests/unit/governance-policy-enforcement-engine tests/unit/governance-query-certification tests/unit/governance-query-contract tests/unit/governance-replay-certification tests/unit/governance-replay-contract tests/unit/governance-replay-viewer tests/unit/governance-risk-certification tests/unit/governance-risk-scoring tests/unit/governance-risk tests/unit/governance-search-engine tests/unit/governance-state-reconstruction tests/unit/governance-tamper-detection tests/unit/governance-visibility-certification tests/unit/governance-weakness tests/unit/policy-analysis tests/unit/policy-correlation tests/unit/policy-dependency-graph tests/unit/policy-impact-analysis tests/unit/policy-intelligence-certification tests/unit/policy-lineage-reconstruction tests/unit/security-governance-validation-engine --reporter dot`
- `npm run typecheck`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Proceed only after staged-diff verification reports zero unexpected paths and Governance validation passes.

## Commit Readiness

Commit-ready. Governance targeted validation passed by batched validation, TypeScript passed, classifier passed as script, and staged-diff guard reported zero unexpected paths.
