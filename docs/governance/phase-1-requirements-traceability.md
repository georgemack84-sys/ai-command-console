# Phase 1 Requirements-to-Evidence Traceability

This matrix maps every implementable Phase 1 requirement to its primary evidence. Requirement 100 is a roadmap reference, not an implementation obligation.

| Requirements | Evidence |
| --- | --- |
| 1 | `phase1FinalAcceptance` verifies the system-wide semantic-unit-to-classification boundary without learning side effects. |
| 2–7 | Frozen registry, schema, canonical types, and non-effect pipeline contracts. |
| 8–15 | Semantic-unit, confidence, ambiguity, provenance, and classification-result contracts. |
| 16–20 | Golden/adversarial/evaluation suites, governance proposals, and release gate. |
| 21 | Canonical specification, registry, category-card renderer, taxonomy README, lifecycle spec, and user guide. |
| 22–31 | Segmentation/pipeline, context, attribution, precedence, calibration, and conservative-failure contracts. |
| 32–35 | Relationship, history, correction, override, and non-escalation contracts. |
| 36–54 | Boundary/adversarial cases, semantic modifiers, context precedence, and cardinality validation. |
| 55–61 | Semantic identity, history/replay, controlled overrides, unknown policy, and compatibility contracts. |
| 62–63 | Deprecation and extension-analysis validation. |
| 64–80 | Orthogonal dimensions, defaults/invariants, decision trees, risk matrix, replay, calibration, and confirmation safeguards. |
| 81–86 | Silent conservative handling, explicit user/non-learning controls, generated reference/cards, and user guide. |
| 87–95 | Golden, boundary, sequence, example-containment, prompt-injection, repository audit, and implementation-order evidence. |
| 96–99 | Final acceptance service, this traceability matrix, final report, and architectural-invariant checks. |
| 100 | Phase 2 scope specification, explicitly deferred until this Phase 1 closure. |
| 101 | Final structured classification record represented by semantic unit, result, controls, attribution, orthogonal dimensions, and unresolved scope/validation states. |

## Core invariant evidence

- Classification has no persistence, authority, or execution effects: pipeline, evaluator, replay, confirmation, and final-acceptance contracts.
- Questions, ideas, suggestions, preferences, instructions, procedures, examples, goals, feedback, corrections, and exceptions retain their negative semantics through registry boundaries, category invariants, and adversarial/sequence regressions.
- Repetition cannot increase authority; corrections preserve history; exceptions retain their underlying rule.

Verification command:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/learning-constitution --reporter=dot
```
