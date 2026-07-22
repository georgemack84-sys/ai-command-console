# Phase 8ALT.8.1 - Optimization Opportunity Discovery

The Optimization Opportunity Discovery phase observes controlled autonomy activity and records deterministic opportunities for later impact analysis. It does not optimize, reroute, reschedule, mutate governance, or change mission behavior.

## Scope

- Discovery is observational and advisory only.
- Records are immutable, replay-linked, tenant-isolated, and integrity hashed.
- Projected improvement is separate from authorization to improve.
- Every opportunity follows the lifecycle `OBSERVED -> IDENTIFIED -> CLASSIFIED -> BASELINED -> EVIDENCE_COLLECTED -> READY_FOR_ANALYSIS`.
- Fault scenarios fail closed and block readiness for impact analysis.

## API Surface

- `GET /api/optimization-opportunity-discovery/discover`
- `POST /api/optimization-opportunity-discovery/discover`
- `POST /api/optimization-opportunity-discovery/baselines`
- `POST /api/optimization-opportunity-discovery/evidence`
- `POST /api/optimization-opportunity-discovery/registry`
- `POST /api/optimization-opportunity-discovery/validate`
- `GET /api/optimization-opportunity-discovery/inspect`
- `POST /api/optimization-opportunity-discovery/inspect`

## Guarantees

All outputs carry explicit non-authority fields: `advisory_only: true`, `execution_authority: false`, and `automatic_optimization: false`. The module can identify and explain opportunities, but it cannot apply them.

## Produces For

The registry, baselines, evidence, validation, and observability surfaces are ready for Phase 8ALT.8.2 Optimization Impact Analysis.
