# Layer Boundary Rules

Version: 1
Last updated: 2026-04-24
Applies to: Phase 3.4C and later

## Goal

Enforce one-way advisory learning boundaries.

MissionControl is an operator system.
Learning increases awareness, not authority.

## Boundary Rules

### Outcome Capture

MAY:

- record execution outcomes
- record operator feedback
- write advisory observations

MAY NOT:

- trigger learning-side execution
- block execution directly
- call planner

### Pattern Detector

MAY:

- read stored outcomes and feedback
- write or update learning patterns

MAY NOT:

- call planner
- call execution engine
- call router

### Confidence Engine

MUST:

- compute temporal decay via `computeEffectiveConfidence()`

MAY:

- read stored patterns
- compute advisory confidence

MAY NOT:

- write patterns
- call planner
- call execution

### Planner Adapter

MAY:

- attach `LearningAdvisory`
- expose active advisory hints to planning/control surfaces

MAY NOT:

- modify steps
- promote patterns
- invoke learning writes as a side effect of advisory reads

### Governance

MAY:

- approve or reject promotion
- mark patterns shadow/active/deprecated

MAY NOT:

- trigger execution
- invoke planner
- bypass review or control

## Import Rules

Learning-layer modules MUST NOT import:

- execution engine modules
- router modules
- execution-triggering modules

Allowed:

- shared interfaces
- persistence primitives
- audit/logging primitives
- math/helpers with no execution side effects

## Structural Enforcement

Primary enforcement target:

- static import restrictions where lint scope supports it

Secondary enforcement target:

- boundary tests that fail on forbidden imports

## Current Known Gap Template

If static enforcement is not available for a layer, record:

`KNOWN GAP: import-boundary enforcement unavailable`

and specify the exact file scope that remains uncovered.
