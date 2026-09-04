# Phase 1 — Orthogonal Semantics and Decision Support

This specification closes Game Plan C without turning taxonomy classification into learning, authority, persistence, scope promotion, or execution.

## Information dimensions

Only `category` is a canonical taxonomy identifier. Domain/topic, sentiment, scope, authority, durability, validation, confidence, status, temporality, learning intent, source/reliability, and relationships are separate dimensions. A `DATABASE` domain or `NEGATIVE` sentiment therefore cannot become a category such as `DATABASE_DECISION` or `NEGATIVE_FEEDBACK`.

The `InformationUnitOrthogonalDimensions` contract deliberately uses `NONE` for taxonomy-level authority and durability defaults. Classification may describe these dimensions, but it cannot grant them. Scope remains unresolved unless separately resolved by the scope model.

## Category defaults and invariants

`CATEGORY_DEFAULT_MATRIX` is derived from the frozen v1 registry and assigns every category `NONE` durability and authority by default. It preserves each category's candidate-knowledge, promotion, validation, and scope requirements as explicit metadata.

`CATEGORY_INVARIANTS` provides at least one conservative rule for every frozen category. The rules make high-impact boundaries explicit: examples do not govern, questions do not assert, ideas do not adopt, procedures do not authorize, corrections preserve history, and exceptions do not delete their underlying rules.

## Decision support

Two deterministic decision trees support review of the `QUESTION` / `IDEA` / `SUGGESTION` and `INSTRUCTION` / `RULE` boundaries. They are guidance only; they do not alter a classification result.

The risk matrix assigns explicit severity to known unsafe misclassifications. User confirmation is requested only for a critical ambiguity, correction-versus-exception ambiguity, or a category whose meaning is materially scope dependent. Confirmation requests are metadata only and cannot persist information, change authority, or authorize execution.

## Verification

The unit suite validates that all 18 categories have conservative defaults and invariants, dimensions reject authority/persistence effects, and risk/confirmation behavior remains promotion-neutral.
