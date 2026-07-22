# Phase 8ALT.10.5 - Constitutional Resilience Assessment

The Constitutional Resilience Assessment Engine turns constitutional validation, runtime monitoring, and violation detection evidence into deterministic resilience measurements.

This phase is strictly observational. It produces scores, explanations, trends, assessment records, and append-only ledger entries, but it does not modify execution, mutate policy, grant authority, or perform autonomous remediation. Fail-closed is represented as an assessment state and governance requirement.

## Scoring Domains

- Authority: 15%
- Governance: 15%
- Replay: 10%
- Integrity: 15%
- Operator Control: 15%
- Policy: 10%
- Isolation: 10%
- Learning Safety: 5%
- Optimization Safety: 5%

Weights are immutable during assessment and must total `1.0`.

## API

- `GET /api/constitutional-resilience-assessment/assess`
- `POST /api/constitutional-resilience-assessment/assess`
- `POST /api/constitutional-resilience-assessment/scores`
- `POST /api/constitutional-resilience-assessment/trends`
- `POST /api/constitutional-resilience-assessment/explanations`
- `POST /api/constitutional-resilience-assessment/ledger`
- `POST /api/constitutional-resilience-assessment/validate`
- `GET|POST /api/constitutional-resilience-assessment/inspect`

## Validation

Validation checks deterministic scoring, replay identity, immutable weights, complete explanations, evidence integrity, lineage, tenant isolation, health calculation, and no-execution-influence guarantees.
