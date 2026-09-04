# Phase 1 — Relationships, History, and Human Correction

- Game plan: [Game Plan B](phase-1-completion-game-plans.md)
- Status: Complete — Parts B1 through B5

## Contracts

Taxonomy relationships are separate from categories. `CORRECTION` requires `CORRECTS` or `SUPERSEDES`; `EXCEPTION` requires `EXCEPTS`; examples, decisions, and feedback accept only their declared relationship types. Relationships are proposed or recorded metadata and never alter authority or durable knowledge.

Classification history is immutable and revisioned per semantic unit. A reclassification records a system interpretation change. A canonical `CORRECTION` is source content that may relate to prior information; it is never conflated with a reclassification event.

Manual overrides require a reviewer, reason, timestamp, prior category, and new category. They create a new immutable history revision with `MANUAL_OVERRIDE` basis. Repetition always produces `NO_ESCALATION`.
