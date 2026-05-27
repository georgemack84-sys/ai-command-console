# Safety Constraints

Version: 1
Last updated: 2026-04-24
Applies to: Phase 3.4C and later

## Core Safety Principle

Learning is advisory only.

It may inform human review or planning context.
It may never execute, route, approve, retry, or mutate execution.

## Hard Constraints

1. No second execution system.
2. No learning-triggered execution.
3. No policy bypass through confidence.
4. No direct planner invocation from learning.
5. No direct execution invocation from learning.
6. No direct router invocation from learning.
7. No mutation of steps from learning.
8. No stored effective confidence values.
9. No promotion without evidence and approval.
10. No silent failure.

## Required Failure Behavior

If learning fails:

- execution continues
- learning disables or degrades safely
- audit event is emitted

## Required Audit Events

- `learning.outcome_recorded`
- `learning.feedback_recorded`
- `learning.pattern_detected`
- `learning.pattern_promoted`
- `learning.confidence_computed`
- `learning.error`

## Shadow Mode Rule

Default pattern mode is `shadow`.

Shadow mode means:

- visible to operators
- visible in advisory diagnostics
- not used for active advisory hints

## Contradiction Rule

If conflicting outcomes are detected:

- validation status becomes `conflicting`
- promotion is blocked
- confidence is reduced
- operator resolution is required before promotion

## Trust Rule

If no trust model exists:

- use weight `1.0`
- annotate implementation with `TRUST_MODEL_PLACEHOLDER`

## Explainability Rule

If evidence is insufficient:

- advisory must report unavailable
- reason must surface as `INSUFFICIENT_EVIDENCE`

## Non-Negotiable Behavior

No advisory output may change:

- execution mode
- review status
- router dispatch behavior
- step ordering
- step content

without an explicit non-learning governance path.
