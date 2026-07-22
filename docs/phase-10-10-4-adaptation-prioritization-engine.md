# Phase 10.10.4 — Adaptation Prioritization Engine

## Purpose

Determines deterministic advisory priority for scored adaptation proposals using mission value, urgency, recurrence, governance significance, constitutional importance, evidence strength, and readiness.

## Implemented Surface

- `POST /adaptation-prioritization-engine/prioritize`
- `POST /adaptation-prioritization-engine/priorities`
- `POST /adaptation-prioritization-engine/factors`
- `POST /adaptation-prioritization-engine/explanations`
- `POST /adaptation-prioritization-engine/metrics`
- `POST /adaptation-prioritization-engine/replay`
- `POST /adaptation-prioritization-engine/inspect`
- `GET /adaptation-prioritization-engine/contract`

## Priority Levels

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`
- `DEFERRED`

## Factors

The engine evaluates expected benefit, urgency, recurrence, mission impact, operator impact, governance impact, constitutional importance, evidence strength, simulation readiness, and certification readiness.

## Determinism

Priority scores use versioned factor weights and deterministic tie-breaking by constitutional importance, governance impact, mission impact, evidence strength, operator impact, and proposal identifier.

## Authority Boundary

The engine ranks proposals only. It does not approve, reject, suppress, implement, mutate proposals, or alter governance workflows.
