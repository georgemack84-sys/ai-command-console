# Mission Control Phase 9.1.3 - Decision Classification Framework

## Purpose

Phase 9.1.3 establishes the authoritative Decision Classification Framework for Mission Control. It maps every validated Phase 9 decision input to exactly one primary decision category from the Phase 9.1.2 taxonomy, then attaches immutable behavior, governance, constitutional, replay, lineage, validation, lifecycle, and authority profiles.

The framework classifies only. It does not evaluate, prioritize, approve, execute, mutate governance, change constitutional rules, or self-authorize.

## Canonical Implementation

- `types/decision-classification.ts`
- `services/decision-classification/index.ts`
- `tests/unit/decision-classification/decisionClassification.test.ts`

## Taxonomy

The registry defines all supported categories:

- `PLAN_SELECTION`
- `RECOMMENDATION_SELECTION`
- `RISK_RESPONSE`
- `RECOVERY_OPTION`
- `GOVERNANCE_ESCALATION`
- `POLICY_CONFLICT`
- `MISSION_HEALTH_ACTION`
- `FORECAST_RESPONSE`
- `OPERATOR_INTERVENTION`
- `CERTIFICATION_DECISION`
- `CONTINUATION_DECISION`
- `DEFERRAL_DECISION`

Every category is represented by a `DecisionClassificationRecord` with a stable classification id, behavioral profile, advisory-only authority level, governance requirements, constitutional requirements, replay requirements, lineage requirements, validation profile, lifecycle profile, taxonomy version, active status, timestamp, and integrity hash.

## APIs

- `classifyDecision()`
- `getDecisionClassification()`
- `validateDecisionClassification()`
- `resolveBehaviorProfile()`
- `validateDecisionTaxonomy()`
- `buildDecisionClassificationObservability()`
- `getDecisionClassificationFramework()`

## Guarantees

Classification is deterministic and registry-driven. Identical decision inputs with the same taxonomy version produce identical primary categories and classification hashes. Each classification inherits governance validation, constitutional validation, replay requirements, lineage requirements, integrity requirements, tenant isolation, advisory-only behavior, and fail-closed enforcement.

Validation fails closed for undefined categories, inactive categories, duplicate primary classification, unsupported taxonomy versions, missing behavior profiles, missing governance profiles, missing constitutional profiles, missing replay or lineage profiles, tenant isolation violations, advisory-only violations, and integrity mismatches.

## Exit Criteria

Phase 9.1.3 is complete when the registry covers every supported category, classification returns exactly one primary category, category behaviors and inherited guarantees are enforced, taxonomy validation passes, deterministic replay hashes reproduce, tenant isolation and advisory-only boundaries are enforced, and focused tests cover valid classifications plus fail-closed boundary cases.
