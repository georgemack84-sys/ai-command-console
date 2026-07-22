# Phase 13.2 - Assurance Dependency Evaluation

Phase 13.2 establishes the deterministic dependency model for Mission Control assurance engines. It defines the canonical dependency graph, registry, validation rules, topological ordering, immutable execution plans, PRUNED semantics, propagation behavior, replay, explainability, integrity validation, and append-only audit ledger.

## Service

`services/assurance-dependency-evaluation` exposes:

- `runAssuranceDependencyEvaluation(input?)`
- `validateAssuranceDependencyEvaluation(result?)`
- `replayAssuranceDependencyEvaluation(result?)`
- `getAssuranceDependencyEvaluationContract()`

The service consumes Phase 13.1 constitutional authority hierarchy and prevents assurance engines from executing when blocking prerequisites fail or are unavailable. `PRUNED` is modeled as prevented execution, not execution failure.

## API

Authenticated workspace members can inspect:

- `GET /api/assurance-dependency-evaluation/contract`
- `GET|POST /api/assurance-dependency-evaluation/graph`
- `GET|POST /api/assurance-dependency-evaluation/registry`
- `GET|POST /api/assurance-dependency-evaluation/dependency-validation`
- `GET|POST /api/assurance-dependency-evaluation/ordering`
- `GET|POST /api/assurance-dependency-evaluation/plan`
- `GET|POST /api/assurance-dependency-evaluation/execution`
- `GET|POST /api/assurance-dependency-evaluation/propagation`
- `GET|POST /api/assurance-dependency-evaluation/replay`
- `GET|POST /api/assurance-dependency-evaluation/explain`
- `GET|POST /api/assurance-dependency-evaluation/integrity`
- `GET|POST /api/assurance-dependency-evaluation/ledger`
- `GET|POST /api/assurance-dependency-evaluation/certification`
- `POST /api/assurance-dependency-evaluation/validate`

POST requests may provide a `result` or a scenario such as `CIRCULAR_DEPENDENCY`, `ORDERING_NONDETERMINISTIC`, `PRUNED_EXECUTED`, or `REPLAY_MISMATCH`.
