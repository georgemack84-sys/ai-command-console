# Phase 8M.26 Residual Generated Artifact Audit

Status: disposition complete, not staged for artifact integration

## Summary

- Residual generated artifact entries: 40.
- Disposition coverage: 40 of 40 classified.
- Commit action in this phase: none for residual artifacts.
- Primary recommendation: create a follow-up residual generated disposition phase before committing Bundle C source changes.

## Disposition Legend

- `Commit with existing domain`: belongs to a generated domain already committed, but needs a narrow follow-up commit or source-review commit.
- `Move to new generated bundle`: belongs to a coherent generated bundle not previously integrated.
- `Manual review required`: depends on source surfaces or product direction and should not be committed without owner approval.

## Artifact Inventory

| Path | Originating domain | Current owner | Dependency analysis | Disposition | Justification |
| --- | --- | --- | --- | --- | --- |
| `app/api/v1/runtime/health/route.ts` | Runtime | Runtime platform owner | Re-exports runtime continuity handler; tracked modification changes route export shape. | Commit with existing domain | Existing Runtime domain follow-up; requires runtime route validation with source review. |
| `services/recommendation-constraint/index.ts` | Recommendation | Recommendation owner | Exports previously committed recommendation-constraint generated modules. | Commit with existing domain | Existing Recommendation domain follow-up; must be reviewed with recommendation tests. |
| `services/simulation-engine/index.ts` | Runtime / Simulation | Runtime simulation owner | Exports simulation completion certification gate. | Commit with existing domain | Existing Runtime simulation follow-up; depends on completion gate artifact and test. |
| `services/simulation-engine/types.ts` | Runtime / Simulation | Runtime simulation owner | Adds simulation completion certification request/result/record types. | Commit with existing domain | Existing Runtime simulation follow-up; public type surface requires targeted tests. |
| `app/api/decision-influence-analysis/` | Governance intelligence | Governance intelligence owner | Imports `services/decision-influence-analysis` and `types/decision-influence-analysis`. | Move to new generated bundle | Coherent API/service/type/test/doc family remains outside prior domains. |
| `app/api/historical-intelligence-engine/` | Predictive intelligence | Predictive intelligence owner | Imports `services/historical-intelligence-engine` and related types. | Move to new generated bundle | Pairs with historical intelligence service/test/type/doc entries. |
| `app/api/risk-forecasting-engine/` | Predictive intelligence | Predictive intelligence owner | Depends on historical intelligence service and types. | Move to new generated bundle | Must follow historical intelligence in the same or subsequent predictive bundle. |
| `app/api/violation-patterns/` | Governance risk | Governance risk owner | Imports `services/violation-patterns` and `types/violation-patterns`. | Move to new generated bundle | Coherent governance-risk API/service/type/test/doc family remains unresolved. |
| `docs/phase-1-0-core-system-skeleton.md` | EdgeBook foundation | EdgeBook owner | Documents `src/core` and `src/modules` foundation. | Move to new generated bundle | Belongs with EdgeBook source/test surfaces, not current source commit. |
| `docs/phase-1-1-source-registry.md` | EdgeBook source registry | EdgeBook owner | Documents `src/modules/sources` and EdgeBook source registry tests. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-1-2-market-observation-schema.md` | EdgeBook markets | EdgeBook owner | Documents market schema modules under `src/modules/markets`. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-1-3-ownership-binding.md` | EdgeBook ownership | EdgeBook owner | Documents ownership modules and tests. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-1-4-raw-observation-store.md` | EdgeBook observations | EdgeBook owner | Documents observation store modules and tests. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-1-5-verification-engine.md` | EdgeBook verification | EdgeBook owner | Documents verification modules and tests. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-1-6-basic-change-detection.md` | EdgeBook change detection | EdgeBook owner | Documents change-detection modules and tests. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-1-7-responsible-gambling-guardrails.md` | EdgeBook responsible gambling | EdgeBook owner | Documents responsible-gambling modules and tests. | Move to new generated bundle | Requires EdgeBook bundle validation. |
| `docs/phase-6i-2-hash-chain-engine.md` | Truth Ledger / hash chain | Truth Ledger owner | No matching dirty implementation root remains in this phase. | Manual review required | Documentation-only generated leftover; verify whether superseded by committed Truth Ledger work. |
| `docs/phase-6j-2-search-engine.md` | Truth Ledger / search | Truth Ledger owner | No matching dirty implementation root remains in this phase. | Manual review required | Documentation-only generated leftover; verify whether superseded by committed Truth Ledger work. |
| `docs/phase-7c-2-violation-pattern-detection.md` | Governance risk | Governance risk owner | Documents violation-pattern service/type/API/test set. | Move to new generated bundle | Must move with violation-pattern implementation artifacts. |
| `docs/phase-7g-3-decision-influence-analysis.md` | Governance intelligence | Governance intelligence owner | Documents decision-influence API/service/type/test set. | Move to new generated bundle | Must move with decision-influence implementation artifacts. |
| `docs/phase-8alt-3-2-historical-intelligence-engine.md` | Predictive intelligence | Predictive intelligence owner | Documents historical intelligence API/service/type/test set. | Move to new generated bundle | Must precede risk forecasting because risk imports historical intelligence. |
| `docs/phase-8alt-3-3-risk-forecasting-engine.md` | Predictive intelligence | Predictive intelligence owner | Documents risk forecasting API/service/type/test set. | Move to new generated bundle | Depends on historical intelligence. |
| `services/historical-intelligence-engine/` | Predictive intelligence | Predictive intelligence owner | Consumed by risk forecasting service and tests. | Move to new generated bundle | Core dependency for predictive-intelligence bundle. |
| `services/risk-forecasting-engine/` | Predictive intelligence | Predictive intelligence owner | Imports historical intelligence service and types. | Move to new generated bundle | Must be sequenced after historical intelligence. |
| `services/signal-engine/` | Signal intelligence | Signal intelligence owner | Has matching `tests/unit/signal-engine/`; may relate to QCI docs. | Manual review required | No paired API/type/doc accepted in generated-domain commits; owner must decide archive vs bundle. |
| `services/simulation-engine/intentSimulationCompletionCertificationGate.ts` | Runtime / Simulation | Runtime simulation owner | Exported by modified simulation index and covered by completion certification test. | Commit with existing domain | Existing simulation domain follow-up; do not stage without paired modified types/index/test. |
| `tests/unit/decision-graph/` | Decision graph | Governance intelligence owner | Tests `services/decision-graph`, classified as Bundle C source. | Manual review required | Test depends on source-classified service; reconcile with source owner. |
| `tests/unit/decision-influence-analysis/` | Governance intelligence | Governance intelligence owner | Tests decision-influence service/type/API bundle. | Move to new generated bundle | Pair with decision-influence implementation artifacts. |
| `tests/unit/edgebook/` | EdgeBook foundation | EdgeBook owner | Tests `src/core`, `src/edgebook`, and `src/modules`. | Move to new generated bundle | Must move with EdgeBook source bundle, not source changes alone. |
| `tests/unit/escalation-intelligence/` | Escalation intelligence | Escalation intelligence owner | Tests source-classified `services/escalation-intelligence`. | Manual review required | Pair with source-classified service before commit. |
| `tests/unit/historical-intelligence-engine/` | Predictive intelligence | Predictive intelligence owner | Tests historical intelligence service/types. | Move to new generated bundle | Pair with historical intelligence artifacts. |
| `tests/unit/risk-forecasting-engine/` | Predictive intelligence | Predictive intelligence owner | Tests risk forecasting service/types. | Move to new generated bundle | Depends on historical intelligence bundle. |
| `tests/unit/signal-engine/` | Signal intelligence | Signal intelligence owner | Tests `services/signal-engine`. | Manual review required | Pair with signal-engine owner disposition. |
| `tests/unit/simulation-engine/intentSimulationCompletionCertificationGate.test.ts` | Runtime / Simulation | Runtime simulation owner | Tests completion certification gate and modified simulation exports/types. | Commit with existing domain | Existing simulation domain follow-up; must be staged with related simulation files only. |
| `tests/unit/strategic-readiness/` | Strategic readiness | Mission Control readiness owner | Tests source-classified `services/strategic-readiness`. | Manual review required | Pair with source service owner disposition. |
| `tests/unit/violation-patterns/` | Governance risk | Governance risk owner | Tests violation-pattern service/types/API bundle. | Move to new generated bundle | Pair with violation-pattern implementation artifacts. |
| `types/decision-influence-analysis.ts` | Governance intelligence | Governance intelligence owner | Imported by decision-influence and governance explainability/lineage types. | Move to new generated bundle | Cross-domain type requires coordinated validation. |
| `types/historical-intelligence-engine.ts` | Predictive intelligence | Predictive intelligence owner | Imported by risk forecasting types/service. | Move to new generated bundle | Required before risk forecasting validation. |
| `types/risk-forecasting-engine.ts` | Predictive intelligence | Predictive intelligence owner | Imports historical intelligence types and is consumed by preventative recommendation types. | Move to new generated bundle | Cross-domain type requires coordinated validation. |
| `types/violation-patterns.ts` | Governance risk | Governance risk owner | Imported by governance weakness/risk scoring types and violation-pattern service/tests. | Move to new generated bundle | Cross-domain type requires coordinated validation. |

## Recommended Follow-Up Bundles

- Runtime simulation completion follow-up: 5 entries.
- Recommendation constraint export follow-up: 1 entry.
- Predictive intelligence bundle: historical intelligence and risk forecasting entries.
- Governance risk/intelligence bundle: decision influence and violation patterns entries.
- EdgeBook foundation bundle: phase-1 docs, `src/` implementation, and EdgeBook tests.
- Manual review bundle: signal engine, decision graph, escalation intelligence, strategic readiness, and documentation-only Truth Ledger leftovers.

No residual generated artifact is unclassified.
