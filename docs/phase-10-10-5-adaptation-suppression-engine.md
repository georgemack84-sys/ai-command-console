# Phase 10.10.5 — Adaptation Suppression Engine

## Purpose

Prevents low-quality, unsafe, incomplete, duplicate, or governance-incompatible adaptation proposals from advancing through the adaptive intelligence pipeline.

## Implemented Surface

- `POST /adaptation-suppression-engine/evaluate`
- `POST /adaptation-suppression-engine/decisions`
- `POST /adaptation-suppression-engine/explanations`
- `POST /adaptation-suppression-engine/metrics`
- `POST /adaptation-suppression-engine/replay`
- `POST /adaptation-suppression-engine/inspect`
- `GET /adaptation-suppression-engine/contract`

## Outcomes

- `CONTINUE`: proposal satisfies suppression checks; continuation is not approval.
- `REQUIRES_REWORK`: proposal may continue after corrective improvements.
- `RETURN_FOR_ANALYSIS`: proposal needs additional analysis or consolidation.
- `SUPPRESSED`: proposal progression is blocked until critical deficiencies are resolved.

## Rules

The engine evaluates weak evidence, unclear benefit, excessive risk, incomplete replay, unresolved governance, unresolved authority, duplicate proposals, certification conflict, restricted learning domains, reduced explainability, increased operator confusion, and rollback unavailability.

## Authority Boundary

Suppression affects workflow progression only. The engine never modifies proposal content, deletes proposals, fabricates deficiencies, approves proposals, rejects proposals, prioritizes proposals, implements proposals, or changes production behavior.
