# Phase 8M.21 Generated Recommendation Inventory

Status: discovered, pending staged verification and validation

Source: `git status --short` and `node scripts/phase-8m-quality-gate.cjs --classify`

## Summary

Generated Recommendation entries discovered: 103 generated roots/files before staging expansion.

Bucket counts:

- API roots: 11.
- Documentation files: 10.
- Service roots/files: 29.
- Test roots/files: 31.
- Type files: 11.

Risk: high.

Ownership recommendation: Recommendation systems owner with certification authority review.

## Recommendation Dependency Graph

- Recommendation Contract, Generation, Paths, Validation, and Certification define the canonical recommendation lifecycle.
- Recommendation Constraint, Trust, Resilience, Governance, Drift, Dependency, and Ledger families preserve advisory-only controls, replay fidelity, and certification evidence.
- Compliance Confidence, Planning Confidence, Planning Optimization, Assurance Recommendation, Escalation Recommendation, and Preventative Recommendation contribute confidence, ranking, prioritization, and risk signals.
- Recommendation Portfolio, Opportunity, Impact, Intelligence, Dependency Health, and Dependency Risk provide domain analysis surfaces for review and operator visibility.

## Validation Requirements

- Recommendation targeted Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff guard with zero unexpected paths.

## Architectural Risk

High, because Recommendation spans advisory behavior, ranking, confidence, explainability, trust, resilience, drift, dependencies, governance, ledger evidence, and certification. The tracked `services/recommendation-constraint/index.ts` source change remains excluded and must be reviewed separately.
