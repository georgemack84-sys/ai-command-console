# Advisory Interface Contract

Version: 1
Last updated: 2026-04-24
Applies to: Phase 3.4C and later

## Purpose

Define the only allowed interface between governed learning and the planning/control layer.

Learning is advisory-only.
Learning may increase operator awareness.
Learning may not increase execution authority.

## Canonical Contract

```ts
type LearningAdvisory = {
  available: boolean;
  confidenceScore: number;
  hints: LearningHint[];
  shadowSignals: ShadowSignal[];
  generatedAt: string;
  dataGrounded: boolean;
};
```

Supporting meaning:

- `available`
  - `true` only when grounded evidence exists
  - `false` when evidence is insufficient, stale, conflicting, or unavailable
- `confidenceScore`
  - `0..1`
  - must be derived through `computeEffectiveConfidence()`
  - must not be stored as an effective value
- `hints`
  - planner-readable and review-readable advisory guidance
  - active patterns only
- `shadowSignals`
  - non-authoritative observations
  - includes shadow-mode and unpromoted pattern output
- `generatedAt`
  - advisory generation timestamp
- `dataGrounded`
  - `true` only when evidence used for hints is traceable
  - `false` forces `available = false`

## One-Way Flow

Allowed flow:

`outcomes -> learning storage -> pattern detector -> confidence engine -> advisory interface -> planner/control review`

Forbidden flow:

- learning -> execution engine
- learning -> router
- learning -> planner invocation
- learning -> step mutation
- learning -> execution retry

## Interface Rules

1. Planner may read `LearningAdvisory`.
2. Control/review may read `LearningAdvisory`.
3. Learning may not call planner.
4. Learning may not modify steps.
5. Learning may not set execution mode.
6. Learning may not bypass `blocked`, `confirm_required`, or `paused_for_review`.

## Explainability Rule

If advisory output is not grounded:

- `available = false`
- `dataGrounded = false`
- reason must be represented as `INSUFFICIENT_EVIDENCE` or equivalent surfaced marker

## Temporal Decay Rule

Effective confidence must be computed at read time only:

`confidence_effective = confidence * e^(-decayRate * days_since_last_seen)`

Stored confidence must remain raw confidence.

## Promotion Rule

Only active patterns may contribute to `hints`.

Shadow patterns:

- may appear in `shadowSignals`
- may not affect planner/control advisory output

Promotion requires:

1. `evidence_count >= minimumEvidenceCount`
2. explicit approval record exists
3. no contradictions within the oscillation window

## Safety Consequence

Any design that lets advisory output alter execution behavior directly violates this contract.
