# Mission Control Phase 9.5.1 - Priority Evaluation Contract

## Preview

Phase 9.5.1 establishes the canonical deterministic contract for evaluating Decision Candidate priority. It defines the priority object, scoring factors, lifecycle, required governance and replay evidence, integrity rules, replay behavior, and advisory-only validation boundary.

## Tightened Scope

The contract creates and validates immutable `DecisionPriority` objects. It does not perform advanced mission or urgency scoring yet; those engines begin in Phase 9.5.2. This phase supplies the stable schema, equal-weight baseline profile, state classification, lifecycle transitions, explanation record, replay verifier, and observability surface.

## Implementation

Implemented in `services/decision-priority-contract/index.ts`.

Primary APIs:

- `createDecisionPriority`
- `validateDecisionPriority`
- `replayDecisionPriority`
- `transitionDecisionPriorityLifecycle`
- `buildDecisionPriorityExplanation`
- `buildDecisionPriorityObservability`
- `getPriorityEvaluationContractFoundation`

Produced artifacts:

- `DecisionPriority`
- `DecisionPriorityScoringProfile`
- `DecisionPriorityExplanation`
- `DecisionPriorityValidationResult`
- `DecisionPriorityReplayResult`
- `DecisionPriorityLifecycleTransition`
- `DecisionPriorityObservability`

## Fail-Closed Rules

Validation rejects:

- missing candidate identity
- missing evidence references
- missing governance references
- missing constitutional references
- missing authority references
- missing replay references
- unknown scoring profile
- scores outside `0-100`
- invalid priority state
- integrity hash mismatch
- replay mismatch
- constitutional violation
- tenant isolation violation
- advisory-only violation
- hidden scoring logic

## Determinism

Priority evaluation uses stable factor ordering, a versioned scoring profile, canonical serialization, reproducible hashes, deterministic state thresholds, stable timestamp refs, and immutable replay records. Hidden scoring and nondeterministic ranking are rejected.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 1 file, 6 tests passed.
