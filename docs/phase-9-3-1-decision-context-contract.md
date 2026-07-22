# Mission Control Phase 9.3.1 - Decision Context Contract

## Preview

Phase 9.3.1 establishes the immutable `DecisionContext` contract used by downstream decision orchestration. It turns a normalized decision candidate into a canonical contextual envelope with identity, lifecycle, versioning, mandatory domains, explainability metadata, integrity, replay, and validation rules.

## Tightened Scope

- This phase defines and validates the context contract; it does not resolve live mission, risk, governance, runtime, or forecast data.
- Every required context domain is represented in fixed construction order and includes source, record, resolver, evidence, governance rationale, constitutional rationale, confidence, and replay metadata.
- Optional or unavailable domains must be recorded in `missing_context`; silent omission is invalid.
- Context identity, schema version, context version, lifecycle state, integrity, and replay are deterministic.
- Validation fails closed for missing domains, schema mismatch, identity mismatch, governance/constitutional/replay gaps, tenant leaks, advisory violations, and integrity mismatch.

## Implementation

- `types/decision-context-contract.ts` defines the canonical `DecisionContext`, context domains, identity, integrity, validation, lifecycle transition, replay, build input, and observability contracts.
- `services/decision-context-contract/index.ts` implements deterministic construction from normalized candidates, canonical serialization and hashing, validation, lifecycle transition checks, replay reconstruction, and metrics.
- `tests/unit/decision-context-contract/decisionContextContract.test.ts` verifies canonical construction, deterministic hashing, normalized-candidate integration, validation failures, lifecycle transitions, replay, and observability.

## Public API

- `createDecisionContext`
- `serializeDecisionContext`
- `computeDecisionContextIntegrityHash`
- `validateDecisionContext`
- `transitionDecisionContextLifecycle`
- `replayDecisionContext`
- `buildDecisionContextObservability`
- `getDecisionContextContractFoundation`
