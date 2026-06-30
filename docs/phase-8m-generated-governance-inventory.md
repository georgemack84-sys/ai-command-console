# Phase 8M.18 Generated Governance Inventory

Status: discovered, pending staged verification and validation

Source: `node scripts/phase-8m-quality-gate.cjs --classify`

## Summary

Generated Governance entries discovered: 228 classifier roots before staging expansion.

Bucket counts:

- API roots: 44.
- App UI roots: 4.
- Component roots: 4.
- Documentation files: 44.
- Service roots: 44.
- Test roots: 44.
- Type files: 44.

Risk: high.

Ownership recommendation: Governance policy owner with certification authority review.

## Generated Families

Each generated family below is represented across matching `app/api/`, `services/`, `tests/unit/`, and `types/` surfaces unless noted otherwise:

- `authority-boundary-engine`
- `boundary-enforcement-contract`
- `governance-assurance-engine`
- `governance-authority-boundary-validation`
- `governance-certification-orchestrator`
- `governance-cross-ledger-correlation`
- `governance-dashboard`
- `governance-deterministic-replay-validation`
- `governance-explainability`
- `governance-hash-chain`
- `governance-historical-reconstruction`
- `governance-input-reconstruction`
- `governance-integrity-certification`
- `governance-integrity-contract`
- `governance-integrity-validation`
- `governance-integrity-verification`
- `governance-integrity-viewer`
- `governance-intelligence`
- `governance-intelligence-completion-gate`
- `governance-isolation-validation`
- `governance-lineage`
- `governance-lineage-explorer`
- `governance-output-verification`
- `governance-policy-enforcement-engine`
- `governance-query-certification`
- `governance-query-contract`
- `governance-replay-certification`
- `governance-replay-contract`
- `governance-replay-viewer`
- `governance-risk`
- `governance-risk-certification`
- `governance-risk-scoring`
- `governance-search-engine`
- `governance-state-reconstruction`
- `governance-tamper-detection`
- `governance-visibility-certification`
- `governance-weakness`
- `policy-analysis`
- `policy-correlation`
- `policy-dependency-graph`
- `policy-impact-analysis`
- `policy-intelligence-certification`
- `policy-lineage-reconstruction`
- `security-governance-validation-engine`

Generated UI-only roots:

- `app/governance-dashboard/`
- `app/governance-integrity-viewer/`
- `app/governance-lineage-explorer/`
- `app/governance-replay-viewer/`
- `components/governance-dashboard/`
- `components/governance-integrity-viewer/`
- `components/governance-lineage-explorer/`
- `components/governance-replay-viewer/`

## Documentation Inventory

- `docs/phase-7a-1-governance-intelligence-contract.md`
- `docs/phase-7a-2-governance-intelligence-states.md`
- `docs/phase-7a-3-governance-intelligence-identity.md`
- `docs/phase-7a-4-governance-intelligence-lifecycle.md`
- `docs/phase-7b-1-policy-analysis-contract.md`
- `docs/phase-7b-2-policy-correlation-engine.md`
- `docs/phase-7b-3-policy-dependency-graph.md`
- `docs/phase-7b-4-policy-impact-analysis.md`
- `docs/phase-7b-5-policy-intelligence-certification-gate.md`
- `docs/phase-7c-1-governance-risk-contract.md`
- `docs/phase-7c-3-governance-weakness-analysis.md`
- `docs/phase-7c-4-governance-risk-scoring.md`
- `docs/phase-7c-5-governance-risk-certification-gate.md`
- `docs/phase-7e-3-alternative-governance-paths.md`
- `docs/phase-7g-1-governance-lineage-contract.md`
- `docs/phase-7g-2-policy-lineage-reconstruction.md`
- `docs/phase-7g-4-governance-explainability-engine.md`
- `docs/phase-7h-1-governance-replay-contract.md`
- `docs/phase-7h-2-governance-input-reconstruction.md`
- `docs/phase-7h-3-governance-state-reconstruction.md`
- `docs/phase-7h-4-governance-output-verification.md`
- `docs/phase-7h-5-governance-replay-certification-gate.md`
- `docs/phase-7i-1-governance-integrity-contract.md`
- `docs/phase-7i-2-governance-hash-chain-engine.md`
- `docs/phase-7i-3-governance-tamper-detection.md`
- `docs/phase-7i-4-governance-integrity-verification.md`
- `docs/phase-7i-5-governance-integrity-certification-gate.md`
- `docs/phase-7j-1-governance-query-contract.md`
- `docs/phase-7j-2-governance-search-engine.md`
- `docs/phase-7j-3-historical-governance-reconstruction.md`
- `docs/phase-7j-4-cross-ledger-governance-correlation.md`
- `docs/phase-7k-1-governance-dashboard.md`
- `docs/phase-7k-2-governance-replay-viewer.md`
- `docs/phase-7k-3-governance-lineage-explorer.md`
- `docs/phase-7k-4-governance-integrity-viewer.md`
- `docs/phase-7k-5-governance-visibility-certification-gate.md`
- `docs/phase-7l-3-governance-integrity-validation.md`
- `docs/phase-7l-4-authority-boundary-validation.md`
- `docs/phase-7m-governance-intelligence-completion-gate.md`
- `docs/phase-8e-3-governance-assurance-engine.md`
- `docs/phase-8f-1-boundary-enforcement-contract.md`
- `docs/phase-8f-2-authority-boundary-engine.md`
- `docs/phase-8f-4-governance-policy-enforcement-engine.md`
- `docs/phase-8k-3-security-governance-validation-engine.md`

## Dependencies

- Deterministic governance replay and replay certification.
- Governance integrity contracts, hash chains, tamper detection, and certification evidence.
- Policy correlation, dependency graph, impact analysis, and policy lineage reconstruction.
- Authority boundary and boundary enforcement contract review.
- Query reconstruction and cross-ledger correlation.
- Security-governance validation.

## Validation Requirements

- Governance targeted Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff guard with zero unexpected paths.

## Architectural Risk

High, because Governance includes policy enforcement, authority boundaries, integrity certification, deterministic replay, query reconstruction, and security-governance validation. It may be committed only as an isolated generated-domain baseline.

## Replay Dependencies

Governance replay, deterministic replay validation, input/state/output reconstruction, replay certification, lineage exploration, cross-ledger correlation, and integrity verification must preserve deterministic evidence and immutable reconstruction semantics.
