# Program 5 - Phase P5.4 Autonomy Classification Framework

P5.4 establishes the canonical autonomy classification framework for Civitas. It classifies autonomous behavior, autonomy levels, authority classes, and eligibility conditions so downstream governance, policy, trust, and runtime enforcement can make deterministic decisions.

## Implemented Artifacts

- `types/autonomy-classification-framework.ts` defines `CAFAutonomyClassification`, autonomy taxonomy, autonomy levels, authority classes, eligibility rules, classification registry, classification rules, authority matrix, pipeline, validation, and certification contracts.
- `services/autonomy-classification-framework/index.ts` provides deterministic `runAutonomyClassificationFramework`, `validateAutonomyClassificationFramework`, `replayAutonomyClassificationFramework`, and `getAutonomyClassificationFrameworkBundle` functions.
- `app/api/autonomy-classification-framework/*` exposes authenticated projections for classification, taxonomy, eligibility, registry, authority matrix, pipeline, validation, and readiness.
- `tests/unit/autonomy-classification-framework/autonomyClassificationFramework.test.ts` validates deterministic classification, exactly one active classification, authority consistency, fail-closed eligibility, gate non-bypass, replay, and out-of-scope boundaries.

## Boundary Commitments

P5.4 owns autonomy classification, taxonomy, levels, authority classes, and eligibility rules. It does not execute authority decisions, grant autonomy execution, or grant execution authority.
