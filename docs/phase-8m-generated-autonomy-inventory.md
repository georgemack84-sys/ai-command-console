# Phase 8M.15 Generated Autonomy Inventory

Status: discovered, pending final commit validation

Source: `node scripts/phase-8m-quality-gate.cjs --classify`

## Summary

Generated autonomy entries discovered: 73 classifier roots before staging expansion.

Risk: high.

Ownership recommendation: Autonomy governance owner with certification authority review for controlled/final autonomy gates.

## File Inventory

Autonomy API roots:

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

Autonomy service roots:

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

Autonomy test roots:

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

Autonomy docs and types are listed in `docs/phase-8m-generated-autonomy-manifest.md`.

## Dependencies

- Governance interfaces.
- Constitutional constraints.
- Autonomous hash-chain evidence.
- Replay and reconstruction semantics.
- Query and cross-reference isolation.
- Controlled autonomy completion evidence.
- Final autonomy certification semantics.

## Validation Requirements

- Autonomy targeted Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff guard with zero unexpected paths.
