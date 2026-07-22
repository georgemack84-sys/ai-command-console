# Stage 7 — Human Oversight

Stage 7 implements the constitutional human oversight layer for CATA trust decisions. It receives only governed escalation work from the prior automated trust pipeline and records deterministic, replayable reviewer decisions without bypassing constitutional admissibility, prior denials, fail-closed outcomes, or active restrictions.

## Scope

- Maintains exactly one tenant-isolated oversight queue with deterministic routing, priority, reviewer assignment, recovery, replay, and audit controls.
- Enforces the oversight workflow for evidence review, restriction review, constitutional review, decision preparation, and review completion.
- Defines the review lifecycle states `PENDING`, `UNDER_REVIEW`, `INFORMATION_REQUESTED`, `RESOLVED`, `CANCELLED`, and `SUPERSEDED`.
- Records immutable decision records for `ALLOW`, `ALLOW_WITH_RESTRICTIONS`, `DENY`, `CANCELLED`, and `SUPERSEDED`.
- Resolves escalations only when authority, standing, restrictions, evidence, and constitutional limits remain valid.
- Produces immutable oversight evidence and complete lineage from escalation through final disposition.

## Constitutional Limits

Human oversight cannot authorize work that the constitutional compliance gate rejected, cannot overturn a `DENY` or `FAIL_CLOSED` trust decision, cannot relax restrictions without governed authority, cannot remove evidence, and cannot rewrite historical decision records. Any attempted bypass fails closed.

## Interfaces

- `GET /api/trust-human-oversight-stage-seven/contract`
- `POST /api/trust-human-oversight-stage-seven/validate`
- `GET|POST /api/trust-human-oversight-stage-seven/queue`
- `GET|POST /api/trust-human-oversight-stage-seven/workflow`
- `GET|POST /api/trust-human-oversight-stage-seven/lifecycle`
- `GET|POST /api/trust-human-oversight-stage-seven/decision-record`
- `GET|POST /api/trust-human-oversight-stage-seven/resolution`
- `GET|POST /api/trust-human-oversight-stage-seven/evidence`
- `GET|POST /api/trust-human-oversight-stage-seven/lineage`
- `GET|POST /api/trust-human-oversight-stage-seven/readiness`

All interfaces require an authenticated workspace member and return deterministic evidence-backed sections from the Stage 7 service.

## Qualification

The stage is qualified only when upstream stages 1 through 6 validate, queue routing is deterministic, review lifecycle transitions are valid, decisions are immutable and signed, constitutional limits are preserved, evidence is replayable, and decision lineage is complete.
