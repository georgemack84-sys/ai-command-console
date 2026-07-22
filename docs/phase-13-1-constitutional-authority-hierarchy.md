# Phase 13.1 - Constitutional Authority Hierarchy

Phase 13.1 establishes the immutable authority hierarchy for Mission Control assessments:

`CONSTITUTION -> GOVERNANCE -> OPERATOR -> ASSESSMENT`

The hierarchy is normative, deterministic, replayable, and advisory-only. Lower layers inherit authority only from their direct parent and can never expand, replace, skip, or override higher authority.

## Service

`services/constitutional-authority-hierarchy` exposes:

- `runConstitutionalAuthorityHierarchy(input?)`
- `validateConstitutionalAuthorityHierarchy(result?)`
- `replayConstitutionalAuthorityHierarchy(result?)`
- `getConstitutionalAuthorityHierarchyContract()`

The service consumes the Phase 12 certification gate as an upstream readiness boundary and certifies hierarchy structure, resolution order, ceilings, inheritance, advisory enforcement, replay, explainability, integrity, and registry ownership.

## API

Authenticated workspace members can inspect:

- `GET /api/constitutional-authority-hierarchy/contract`
- `GET|POST /api/constitutional-authority-hierarchy/hierarchy`
- `GET|POST /api/constitutional-authority-hierarchy/resolution`
- `GET|POST /api/constitutional-authority-hierarchy/ceilings`
- `GET|POST /api/constitutional-authority-hierarchy/inheritance`
- `GET|POST /api/constitutional-authority-hierarchy/advisory-boundary`
- `GET|POST /api/constitutional-authority-hierarchy/replay`
- `GET|POST /api/constitutional-authority-hierarchy/explain`
- `GET|POST /api/constitutional-authority-hierarchy/integrity`
- `GET|POST /api/constitutional-authority-hierarchy/registry`
- `GET|POST /api/constitutional-authority-hierarchy/certification`
- `POST /api/constitutional-authority-hierarchy/validate`

POST requests may provide a `result` or a scenario such as `GOVERNANCE_EXCEEDS_CONSTITUTION`, `ASSESSMENT_EXCEEDS_OPERATOR`, `EXECUTION_AUTHORITY_PRODUCED`, or `AMBIGUOUS_AUTHORITY`.
