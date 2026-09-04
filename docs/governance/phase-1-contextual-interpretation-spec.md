# Phase 1 — Contextual Interpretation Specification

- Game plan: [Game Plan A](phase-1-completion-game-plans.md)
- Status: Complete — Parts A1 through A6

## Context boundary

Classification may use only a declared, bounded context window. Source priority is:

1. Current explicit statement
2. Explicit reference target
3. Immediate conversation
4. Active project context
5. Durable knowledge
6. Historical conversation

The default maximum is six frames. Callers may request fewer frames; they cannot request more. Context carries semantic modifiers only and cannot alter authority, persistence, or execution permission.

## Context modes and exits

Supported modifiers are `BRAINSTORM_CONTEXT`, `DECISION_CONTEXT`, `REVIEW_CONTEXT`, `TEACHING_CONTEXT`, `HYPOTHETICAL_CONTEXT`, and `EXAMPLE_CONTEXT`. They do not replace taxonomy categories.

An explicit current decision exits inherited brainstorming context. Additional inheritance and exit rules will be introduced only with corresponding precedence and regression coverage.

## Part A2 status — controlled contextual classification

An otherwise unresolved unit may be classified as an `IDEA` only when a declared bounded window contains active brainstorming context. The inherited mode is captured as evidence. An explicit current decision exits brainstorming before classification, and no contextual modifier can grant authority, persistence, or execution permission.

## Part A3 status — attribution and classification basis

Contextual classification now preserves a speaker/source attribution derived from provenance and labels every result as `EXPLICIT` or `INFERRED`. Speaker type, source reliability, truth validation, and authority remain distinct: attribution defaults to `NOT_EVALUATED` reliability and truth, and `UNCHANGED` authority. Inherited brainstorming classifications are explicitly marked `INFERRED`.

## Part A4 status — semantic modifiers

Classification now preserves conditional, temporal, modal, negation, teaching, non-learning, explicit-label, and misleading-label signals as separate modifiers. They are evidence for later interpretation, not category IDs, truth claims, authority, persistence, or execution permission.

## Part A5 status — precedence and cardinality

The classifier now has a frozen precedence order. Hypothetical containment wins over current explicit markers; current explicit correction, exception, and decision markers win over inherited context. The pipeline validates that exactly one result exists for every semantic unit, so a unit is never silently omitted or multiply categorized.

## Part A6 status — explicit user and non-learning controls

An explicit user category is preserved only as a `RECORDED_FOR_REVIEW` claim from an operator statement; it cannot override semantic classification, promotion, authority, or execution. Explicit non-learning language is retained as learning intent, and unresolved outcomes use `SILENT_CONSERVATIVE` handling rather than being forced into a category.
