# Audit Integrity and Verification Boundary

- Phase: Phase 0, Part XXII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Each append receives a canonical SHA-256 hash chained to its predecessor for every audit key. Verification recomputes the chain without writing or repairing history.

## Outcomes

- `VALID`: sequence, predecessor, event presence, and hash recomputation agree.
- `CHAIN_BROKEN`: sequence or predecessor link is invalid.
- `EVENT_MISSING`: an integrity entry has no corresponding stored event.
- `HASH_MISMATCH`: canonical event content no longer matches its recorded hash.
- `INSUFFICIENT_HISTORY`: no chain exists for the requested key.

## Guardrail

```text
Verification detects integrity failures.
Verification does not repair, reorder, rewrite, or delete audit history.
```
