# Phase 40 — Noesis Strategy Selection Engine Exit

## Outcome

Noesis can now create an immutable learning-objective profile, apply Phase 37 hard eligibility and Phase 39 contextual evidence, issue an explainable advisory strategy recommendation, and learn from governed outcomes. Phase 40 changes how learning is selected; it never grants learning execution, capability, certification, or authority.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Classify distinct and mixed objectives | `ObjectiveProfileService`, `LearningObjectiveProfile`, `StrategyCompositionPlan` |
| Retrieve and filter Phase 37 strategies | `StrategySelectionEngineService` delegates hard eligibility to `StrategySelectionService` |
| Use Phase 39 evidence with uncertainty | `StrategyEvaluationProfileService` inputs, policy minimums, evidence snapshots, and supported-evidence gates |
| Use competency, gaps, risk, and cost | Objective profile, learner snapshot, policy scoring, and hard policy disqualifications |
| Explain and replay selection | Immutable selection records retain policy, classifier, registry, and evidence-snapshot versions |
| Compose complex strategies | `StrategySelectionEngineService.compose` |
| Escalate and reselect after diagnosis | `escalate`, `SelectionOutcomeDiagnosisService`, and advisory `reselect` endpoint |
| Record human overrides | `StrategyOverrideService` and protected override endpoint |
| Learn from override results | Selection outcomes support override linkage; comparison analytics is cohort-limited and observational |
| Explore safely | Low-risk-only exploration policy with no execution shortcut |
| Preserve governance and capability boundary | Selection, curriculum proposals, outcomes, analytics, and reselection all remain non-executing; only the existing human Phase 26 approval and Phase 28 lease bridge issues execution authority |
| Audit consequential decisions | Phase 10 audit events are emitted for objective profiles, selections, proposals, approval bridges, materializations, outcomes, overrides, and reselections |

## Protected API surface

- `POST /api/learning/strategy-selection` — record a validated objective profile.
- `POST /api/learning/strategy-selection/select` — create an advisory evidence-gated selection.
- `POST /api/learning/strategy-selection/propose-plan` — create an approval-bound curriculum handoff.
- `POST /api/learning/strategy-selection/approve-plan` — explicit human bridge to the existing Phase 26 proposal and Phase 28 lease.
- `POST /api/learning/strategy-selection/materialize-curriculum` — create a non-executing, prerequisite-safe curriculum.
- `POST /api/learning/strategy-selection/record-outcome` — retain a Phase 39 outcome linked to selection and curriculum.
- `POST /api/learning/strategy-selection/reselect` — create an advisory diagnosis-led reselection.
- `POST /api/learning/strategy-selection/override` — record an auditable human alternate.
- `GET /api/learning/strategy-selection/comparison-analytics?selectionId=…` — read-only observational comparison.

No endpoint on this surface executes a strategy. The only execution authority remains the pre-existing human approval and scoped lease lifecycle.

## Validation

```text
npx tsc --noEmit --pretty false                                      passed
vitest focused Phase 40 service and API suite                        12 files passed, 24 tests passed
```

The suite includes objective validation, evidence-gated selection, curriculum proposal and approval bridge, lease-bound Skill Graph materialization, outcome capture, failure attribution, reselection, human override, observational comparison, and the end-to-end Phase 40 acceptance scenario.

`tests/unit/learning-constitution/phase40ApiAuthorization.test.ts` additionally verifies that every Phase 40 write and analytics route rejects unauthenticated access before reading request state, and that objective intake validation occurs after workspace authorization but before persistence.

`tests/unit/learning-constitution/phase40ApiWorkflow.test.ts` verifies the authorized happy paths for immutable objective-profile intake, evidence-backed advisory selection with no execution permission, and the explicit human approval bridge that creates the bounded lease lineage.

`tests/integration/learning-constitution/phase40DatabaseWorkflow.test.ts` provides opt-in database coverage for profile → selection → curriculum proposal → human approval bridge → bounded lease persistence and audit lineage. It runs only when `NOESIS_RUN_DATABASE_INTEGRATION=true` is set for a dedicated test database. The generated workspace and all associated immutable artifacts remain as provenance, so each run uses unique fixture IDs.

The database workflow was executed against the isolated PostgreSQL test container on 2026-09-04: 1 integration test passed; the complementary no-opt-in safety case was intentionally skipped.

`tests/e2e/strategy-selection-workflow.spec.ts` provides seeded manager-browser acceptance coverage for the profile → advisory selection → proposal → explicit approval flow and verifies that no learning-execution control is rendered. It was executed successfully on 2026-09-04: 1 desktop Chromium test passed.

## Exit state

Before Phase 40, Noesis could retain multiple learning strategies and observe their contextual performance. After Phase 40, it can make a versioned, inspectable, constraint-aware decision about which learning method fits a particular objective, then use governed outcomes to improve the next recommendation.
