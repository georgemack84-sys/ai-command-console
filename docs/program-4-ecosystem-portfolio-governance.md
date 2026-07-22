# Program 4 - Phase P4.20 Ecosystem Portfolio Governance

P4.20 implements the ecosystem-wide portfolio governance aggregation layer for Civitas applications. It produces portfolio dashboards, ecosystem governance reports, health summaries, evidence indexes, analytics, and executive views by aggregating application certificates, certification status, governance evidence, interoperability evidence, and operational evidence.

## Implemented Artifacts

- `types/ecosystem-portfolio-governance.ts` defines portfolio records, health summaries, governance reports, aggregation records, evidence indexes, executive reporting, boundary flags, certification, validation, scenarios, and bundles.
- `services/ecosystem-portfolio-governance/index.ts` provides deterministic `runEcosystemPortfolioGovernance`, `validateEcosystemPortfolioGovernance`, `replayEcosystemPortfolioGovernance`, and `getEcosystemPortfolioGovernanceBundle` functions.
- `app/api/ecosystem-portfolio-governance/*` exposes authenticated contract, validation, and workstream projections.
- `tests/unit/ecosystem-portfolio-governance/ecosystemPortfolioGovernance.test.ts` validates doctrine, inventory completeness, aggregation, dashboards, reports, analytics, health, evidence lineage, executive visibility, replay determinism, and prohibited decision boundaries.

## Boundary Commitments

P4.20 aggregates and reports only. It does not certify, qualify, approve, suspend, revoke, modify governance, override authority, execute operational workflows, alter evidence, or issue constitutional decisions.
